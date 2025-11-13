import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const Authorize: React.FC = () => {
    const navigate = useNavigate();

    console.log("Rendering Authorize component");
    useEffect(() => {
        console.log("Authorize component mounted");
        const params = new URLSearchParams(document.location.search);
        const token = params.get("token");
        if (token) {
            console.log("Received token:", token);
            localStorage.setItem("token", token);
            navigate("/workflows");
        }
    }, []);
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold text-gray-700">Authorizing...</h1>
        <p className="text-gray-500 mt-2">Please wait while we log you in.</p>
        </div>
    );
};
