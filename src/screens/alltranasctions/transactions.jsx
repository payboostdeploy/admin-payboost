import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const Transactions = () => {
    const [totalAmountCurrentMonth, setTotalAmountCurrentMonth] = useState(0);

    useEffect(() => {
        const totalAmount = localStorage.getItem("totalAmountCurrentMonth");
        setTotalAmountCurrentMonth(totalAmount ? Number(totalAmount) : 0);
    }, []);

    return (
        <>
            <Navbar />
            <div className="flex flex-col sm:flex-row min-h-screen">
                <Sidebar />
                <div className="flex-1 p-6">
                    <div className="max-w-4xl mx-auto mt-32 bg-base-300 shadow-lg rounded-lg overflow-hidden">
                        <div className="text-center py-4">
                            <h1 className="text-2xl font-bold"> Transactions </h1>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold mb-2">Total Amount for Current Month</h2>
                                <p className="text-lg">${totalAmountCurrentMonth.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Transactions;
