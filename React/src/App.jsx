import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Login from "./pages/Login";
import AppManager from './manager/App_manager';
 
const App_user = lazy(() => import("./user/App_user"));
 
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/user" element={<App_user />} />
                <Route path="/AppManager" element={<AppManager />} />
            </Routes>
        </BrowserRouter>
    );
}
 
export default App;
 