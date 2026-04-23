import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AppManager from './manager/App_manager';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/AppManager" element={<AppManager />} />
                {/* 나중에 Dashboard 만들면 여기에 추가하면 돼요! */}
            </Routes>
        </Router>
    );
}

export default App;