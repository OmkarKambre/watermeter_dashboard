import './App.css';
import EnterPassword from './EnterPassword';
import 'bootstrap/dist/css/bootstrap.min.css';
import UploadConvert from './UploadConvert';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';

function App() {
const router = createBrowserRouter([
  {
    path:"/",
    element:<><EnterPassword/></>
  },

  {
    path:"/uploadfile",
    element:<><UploadConvert/></>
  },
])

  return (
    <>
      <RouterProvider router={router}/>
    </>
  );
}

export default App;
