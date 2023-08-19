import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { LinkedInCallback } from "react-linkedin-login-oauth2";
import MainPage from "./MainPage";



//-------------------------------------------------------------------------------------------
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route exact path="/linkedin" element={<LinkedInCallback />} />
                <Route path="/" element={<MainPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;