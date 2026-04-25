import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppManager from './manager/App_manager';
 
const App_user = lazy(() => import("./user/App_user"));
 
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/user" element={<App_user />} />
                <Route path="/AppManager" element={<AppManager />} />
            </Routes>
        </BrowserRouter>
    );
}
 
export default App;
 