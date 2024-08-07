    import React, { useState } from "react";
    import HeaderP from "./HeaderP";
    import Button from 'react-bootstrap/Button';
    import Form from 'react-bootstrap/Form';
    import { useNavigate } from 'react-router-dom';

    function EnterPassword() {
        const [password, setPassword] = useState("");
        const [error, setError] = useState("");
        const navigate = useNavigate();

        const handleSubmit = (e) => {
            e.preventDefault();
            const envPassword = process.env.REACT_APP_PASSWORD;

            if (password === envPassword) {
                navigate("/uploadfile");
            } else {
                setError("Incorrect password. Please try again.");
            }
        };

        return (
            <>
                <div>
                    <HeaderP />
                </div>

                <div className="flex justify-center items-center mt-10">
                    <Form onSubmit={handleSubmit} className="w-1/3 bg-white p-6 shadow-lg rounded-lg">
                        <Form.Group className="mb-3" controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder=""
                                className="w-full"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>

                        {error && <p className="text-red-500 text-center">{error}</p>}

                        <div className="flex justify-center">
                            <Button variant="primary" type="submit">Submit</Button>
                        </div>
                    </Form>
                </div>
            </>
        );
    }

    export default EnterPassword;
