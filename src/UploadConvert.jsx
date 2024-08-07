import React, { useState } from "react";
import { Form, Button, Card } from 'react-bootstrap';
import Header from "./Header";
import * as XLSX from 'xlsx';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import Select from 'react-select';

function UploadConvert() {
    const [fileError, setFileError] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [waterConsumptionData, setWaterConsumptionData] = useState(null);
    const [forwardFlowData, setForwardFlowData] = useState(null);
    const [tableData, setTableData] = useState({});
    const [showTable, setShowTable] = useState(false);
    const [selectedPort, setSelectedPort] = useState(1);
    const [availablePorts, setAvailablePorts] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (!allowedTypes.includes(file.type)) {
                setFileError("Please upload a valid CSV or XLSX file.");
                setSelectedFile(null);
            } else {
                setFileError("");
                setSelectedFile(file);
            }
        } else {
            setFileError("Please select a file to upload.");
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setFileError("Please select a file to upload.");
            return;
        }
    
        setUploading(true);
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
            const portData = {};
            const portsSet = new Set();
            let allDates = [];
    
            jsonSheet.forEach((row, index) => {
                if (index === 0) return;
                const time = row[2];
                const hexData = row[6];
                const port = row[5] || 1;
    
                if (time && typeof hexData === 'string') {
                    portsSet.add(port);
                    allDates.push(new Date(time));
    
                    if (!portData[port]) {
                        portData[port] = {
                            labels: [],
                            forwardFlow: [],
                            waterConsumption: [],
                            table: [],
                            previousForwardFlow: null
                        };
                    }
    
                    const timestamp = new Date(time);
                    portData[port].labels.push(timestamp);
    
                    const hexForwardFlow = hexData.substring(4, 12);
                    const currentForwardFlow = parseInt(hexForwardFlow, 16) / 10;
    
                    let waterConsumptionValue = 0;
                    if (portData[port].previousForwardFlow !== null) {
                        waterConsumptionValue = (currentForwardFlow - portData[port].previousForwardFlow) * 10;
                    }
    
                    portData[port].forwardFlow.push(currentForwardFlow);
                    portData[port].waterConsumption.push(waterConsumptionValue);
                    portData[port].table.push({
                        time: timestamp,
                        forwardFlow: currentForwardFlow,
                        waterConsumption: waterConsumptionValue,
                        port: port,
                        batteryLevel: 3.65
                    });
    
                    portData[port].previousForwardFlow = currentForwardFlow;
                }
            });
    
            const minDate = new Date(Math.min(...allDates));
            const maxDate = new Date(Math.max(...allDates));
            setStartDate(minDate.toISOString().split('T')[0]);
            setEndDate(maxDate.toISOString().split('T')[0]);
    
            setAvailablePorts(Array.from(portsSet).map(port => ({ value: port, label: `Port ${port}` })));
            setTableData(portData);
            setShowTable(true);
            setUploading(false);
            setFileError("");
            updateGraphData(portData, selectedPort);
        };
        reader.readAsArrayBuffer(selectedFile);
    };
    

    const updateGraphData = (portData, port) => {
        const data = portData[port];

        const waterConsumptionDataset = {
            labels: data.labels.slice(1),
            datasets: [
                {
                    label: 'Water Consumption',
                    data: data.waterConsumption,
                    borderColor: 'rgba(75,192,192,1)',
                    fill: false,
                }
            ]
        };

        const forwardFlowDataset = {
            labels: data.labels,
            datasets: [
                {
                    label: 'Forward Flow',
                    data: data.forwardFlow,
                    borderColor: 'rgba(153,102,255,1)',
                    fill: false,
                }
            ]
        };

        const chartOptions = {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'dd/MM/yyyy',
                        displayFormats: {
                            day: 'dd/MM/yyyy',
                            month: 'MMM yyyy',
                            year: 'yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Litres'
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };

        setWaterConsumptionData({ dataset: waterConsumptionDataset, options: chartOptions });
        setForwardFlowData({ dataset: forwardFlowDataset, options: chartOptions });
    };

    const handlePortChange = (selectedOption) => {
        const port = selectedOption.value;
        setSelectedPort(port);
        updateGraphData(tableData, port);
    };


    const downloadCSV = () => {
        const csvRows = [];
        csvRows.push(['Timestamp', 'Forward Flow (Litres)', 'Water Consumption (Litres)', 'Port', 'Battery Level', 'Daily Consumption (Litres)'].join(','));
        Object.keys(tableData).forEach(port => {
            tableData[port].table.filter(row => row.time >= new Date(startDate) && row.time <= new Date(endDate)).forEach(row => {
                const dailyConsumptionValue = calculateDailyConsumption(port).find(d => new Date(d.date).toLocaleDateString() === row.time.toLocaleDateString())?.dailyConsumption || 0;
                const rowValues = [
                    row.time.toISOString(),
                    row.forwardFlow,
                    row.waterConsumption,
                    row.port,
                    row.batteryLevel,
                    dailyConsumptionValue
                ];
                csvRows.push(rowValues.join(','));
            });
        });
        const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = csvUrl;
        link.download = 'data.csv';
        link.click();
        URL.revokeObjectURL(csvUrl);
    };

    const calculateDailyConsumption = (port) => {
        const data = tableData[port]?.table.filter(row => row.time >= new Date(startDate) && row.time <= new Date(endDate)) || [];
        const consumptionSummary = [];
    
        if (data.length === 0) return consumptionSummary;
    
        let dailySum = 0;
        let currentDate = new Date(data[0].time);
        currentDate.setHours(0, 0, 0, 0); // Start from midnight
    
        data.forEach((row) => {
            const rowDate = new Date(row.time);
            if (rowDate >= currentDate && rowDate < new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)) {
                dailySum += row.waterConsumption;
            } else {
                consumptionSummary.push({ date: currentDate.toLocaleDateString(), dailyConsumption: dailySum });
                currentDate = new Date(rowDate.setHours(0, 0, 0, 0)); // Move to the new day
                dailySum = row.waterConsumption; // Start new day's sum with the current row's value
            }
        });
    
        // Add the last day's summary
        consumptionSummary.push({ date: currentDate.toLocaleDateString(), dailyConsumption: dailySum });
    
        return consumptionSummary;
    };
    

    // Filter table data based on the selected date range
    const filteredTableData = () => {
        if (!startDate || !endDate) return tableData[selectedPort]?.table || [];

        const start = new Date(startDate);
        const end = new Date(endDate);
        return tableData[selectedPort]?.table.filter(row => row.time >= start && row.time <= end) || [];
    };

    const dailyConsumption = calculateDailyConsumption(selectedPort);

    return (
        <>
            <Header />

            <div className="mt-5">
                <Card className="p-4" style={{ maxWidth: '600px', margin: 'auto' }}>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formFile">
                            <Form.Label>Upload Payload Data</Form.Label>
                            <div className="d-flex justify-content-center align-items-center border rounded p-4">
                                <div className="text-center">
                                    <p className="mb-1">Drag and drop file here</p>
                                    <p className="text-muted">Limit 200MB per file • CSV, XLSX</p>
                                </div>
                            </div>
                            <Form.Control type="file" accept=".csv, .xlsx" onChange={handleFileChange} className="mt-2" />
                            {fileError && <Form.Text className="text-danger">{fileError}</Form.Text>}
                        </Form.Group>

                        {availablePorts.length > 0 && (
                            <Form.Group controlId="formPortSelect" className="mb-3">
                                <Form.Label>Select Port</Form.Label>
                                <Select
                                    options={availablePorts}
                                    onChange={handlePortChange}
                                    value={availablePorts.find(option => option.value === selectedPort)}
                                    className="basic-single"
                                    classNamePrefix="select"
                                />
                            </Form.Group>
                        )}


                        <Button variant="primary" type="submit" className="w-100" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Convert'}
                        </Button>
                    </Form>
                </Card>
            </div>

            <div className="d-flex justify-content-around mt-5">
                {waterConsumptionData && (
                    <div style={{ width: '48%', height: '400px' }}>
                        <h3>Water Consumption vs Time</h3>
                        <Line
                            data={waterConsumptionData.dataset}
                            options={{
                                ...waterConsumptionData.options,
                                plugins: {
                                    title: {
                                        display: true,
                                        text: 'Water Consumption vs Time'
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    }
                                }
                            }}
                        />
                    </div>
                )}

                {forwardFlowData && (
                    <div style={{ width: '48%', height: '400px' }}>
                        <h3>Forward Flow vs Time</h3>
                        <Line
                            data={forwardFlowData.dataset}
                            options={{
                                ...forwardFlowData.options,
                                plugins: {
                                    title: {
                                        display: true,
                                        text: 'Forward Flow vs Time'
                                    },
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </div>

            {showTable && (
    <div className="mt-5 mb-3 flex flex-col items-center">
        <div className="overflow-x-auto rounded-lg border border-gray-300" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="table table-striped table-bordered table-hover">
                <thead>
                    <tr className="table-primary">
                        <th>Timestamp</th>
                        <th>Forward Flow (Litres)</th>
                        <th>Water Consumption (Litres)</th>
                        <th>Port</th>
                        <th>Battery Level</th>
                        <th>Daily Consumption (Litres)</th>
                    </tr>
                </thead>
                <tbody>
    {filteredTableData().reduce((acc, current) => {
        const dailyConsumptionValue = dailyConsumption.find(d => new Date(d.date).toLocaleDateString() === current.time.toLocaleDateString())?.dailyConsumption || 0;
        const existingRow = acc.find(row => row.dailyConsumption === dailyConsumptionValue);
        if (existingRow) {
            existingRow.rows.push(current);
        } else {
            acc.push({
                dailyConsumption: dailyConsumptionValue,
                rows: [current]
            });
        }
        return acc;
    }, []).map((row, index) => (
        <React.Fragment key={index}>
            {row.rows.map((subRow, subIndex) => (
                <tr key={subIndex}>
                    <td>{subRow.time.toLocaleString()}</td>
                    <td>{subRow.forwardFlow}</td>
                    <td>{subRow.waterConsumption}</td>
                    <td>{subRow.port}</td>
                    <td>{subRow.batteryLevel}V</td>
                    {/* Daily Consumption merged cell */}
                    {subIndex === 0 && (
                        <td rowSpan={row.rows.length}>{row.dailyConsumption}</td>
                    )}
                </tr>
            ))}
        </React.Fragment>
    ))}
</tbody>

            </table>
        </div>
        <Button variant="secondary" onClick={downloadCSV} className="mt-3">
            Download Table Data
        </Button>
    </div>
)}

        </>
    );
}

export default UploadConvert;
