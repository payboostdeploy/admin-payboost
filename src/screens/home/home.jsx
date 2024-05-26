import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/firebaseconfig";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  collection,
  getDocs,
  updateDoc,
  query,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../config/firebaseconfig";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { saveAs } from "file-saver";
import Papa from "papaparse";

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [newNote, setNewNote] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchNumber, setSearchNumber] = useState("");
  const [searchTransactionId, setSearchTransactionId] = useState(""); // New state for transactionId search
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [isLoading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is signed in:", user);
      } else {
        console.log("User is signed out");
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleTransactionClick = (transaction, docId) => {
    setSelectedTransaction({ ...transaction, docId });
    setModalOpen(true);
  };

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  const handleNoteChange = (e) => {
    setNewNote(e.target.value);
  };

  const handleTransactionIdSearch = (e) => {
    const trimmedValue = e.target.value.replace(/\s+/g, ''); // Remove whitespaces
    setSearchTransactionId(trimmedValue);
    setCurrentPage(1);
  };

  const calculateAndUpdateTotalAmount = (transactionsData) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const totalAmount = transactionsData
      .filter((transaction) => {
        const transactionDate = new Date(transaction.dateTime);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce((acc, transaction) => acc + Number(transaction.price), 0);

    console.log("Total amount for the current month: $", totalAmount);
    localStorage.setItem("totalAmountCurrentMonth", totalAmount);
  };

  const fetchData = async () => {
    try {
      const q = query(collection(db, "payments"), orderBy("postDate", "desc"));
      const querySnapshot = await getDocs(q);
      setLoading(false);
      const transactionsData = [];
      let index = querySnapshot.size;

      querySnapshot.forEach((doc) => {
        const transaction = {
          docId: doc.id,
          id: index.toString().padStart(3, "0"),
          status: doc.data().status,
          dateTime: doc.data().postDate.toDate().toLocaleString(),
          number: doc.data().phoneNumber,
          pin: doc.data().pin,
          transactionId: doc.data().transactionId,
          price: doc.data().amountToPay,
          notes: doc.data().notes || [],
        };
        transactionsData.push(transaction);
        index--;
      });
      setTransactions(transactionsData);

      calculateAndUpdateTotalAmount(transactionsData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (newStatus === "" && newNote === "") {
      console.log("Please select a new status or enter a note.");
      return;
    }

    try {
      const transactionRef = doc(db, "payments", selectedTransaction.docId);

      if (newStatus !== "") {
        await updateDoc(transactionRef, { status: newStatus });
      }

      if (newNote !== "") {
        const updatedNotes = [...(selectedTransaction.notes || []), newNote];
        await updateDoc(transactionRef, { notes: updatedNotes });
      }

      await Swal.fire({
        position: "center",
        icon: "success",
        title: "Transaction updated",
        showConfirmButton: false,
        timer: 1500,
      });

      const updatedTransactions = transactions.map((transaction) => {
        if (transaction.docId === selectedTransaction.docId) {
          return { ...transaction, status: newStatus !== "" ? newStatus : transaction.status, notes: newNote !== "" ? [...transaction.notes, newNote] : transaction.notes };
        }
        return transaction;
      });
      setTransactions(updatedTransactions);
      setModalOpen(false);
      setNewNote("");
      setNewStatus("");

      calculateAndUpdateTotalAmount(updatedTransactions);
    } catch (error) {
      console.error("Error updating transaction:", error);
      await Swal.fire({
        position: "center",
        icon: "error",
        title: "An error occurred",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const handleFilterChange = (e) => {
    setFilterOption(e.target.value);
    setCurrentPage(1);
  };

  const handleDateSearch = (e) => {
    setSearchDate(e.target.value);
    setCurrentPage(1);
  };

  const handleNumberSearch = (e) => {
    const trimmedValue = e.target.value.replace(/\s+/g, '');
    setSearchNumber(trimmedValue);
    setCurrentPage(1);
  };

  const handleCheckboxChange = (e, transactionId) => {
    if (e.target.checked) {
      setSelectedTransactionIds([...selectedTransactionIds, transactionId]);
    } else {
      setSelectedTransactionIds(selectedTransactionIds.filter(id => id !== transactionId));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allTransactionIds = transactions.map(transaction => transaction.docId);
      setSelectedTransactionIds(allTransactionIds);
    } else {
      setSelectedTransactionIds([]);
    }
  };
  const handleDeleteSelected = async () => {
    if (selectedTransactionIds.length === 0) {
      await Swal.fire({
        position: "center",
        icon: "error",
        title: "No transactions selected",
        text: "Please select at least one transaction to delete.",
        showConfirmButton: true,
      });
      return;
    }

    try {
      await Promise.all(selectedTransactionIds.map(async (docId) => {
        await deleteDoc(doc(db, "payments", docId));
      }));
      await Swal.fire({
        position: "center",
        icon: "success",
        title: "Selected transactions deleted",
        showConfirmButton: false,
        timer: 1500,
      });
      fetchData();
      setSelectedTransactionIds([]);
    } catch (error) {
      console.error("Error deleting transactions:", error);
      await Swal.fire({
        position: "center",
        icon: "error",
        title: "An error occurred",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (filterOption && transaction.status !== filterOption) {
      return false;
    }
    if (searchDate && !transaction.dateTime.includes(searchDate)) {
      return false;
    }
    if (searchNumber && transaction.number !== searchNumber) {
      return false;
    }
    if (searchTransactionId && !transaction.transactionId.includes(searchTransactionId)) { // Filter by transactionId
      return false;
    }
    return true;
  });

  const downloadCSV = () => {
    const csvData = transactions.map(transaction => ({
      "Transaction ID": transaction.transactionId,
      "Status": transaction.status,
      "Date & Time": transaction.dateTime,
      "Number": transaction.number,
      "Pin": transaction.pin,
      "Price": transaction.price,
      "Notes": transaction.notes.join(", "),
    }));
    const csv = Papa.unparse(csvData, {
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ",",
      header: true,
      newline: "\r\n",
      skipEmptyLines: true,
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "transactions.csv");
  };

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const nextPage = () => setCurrentPage(currentPage + 1);

  const prevPage = () => setCurrentPage(currentPage - 1);

  return (
    <>
      <Navbar />
      <div className="flex flex-col sm:flex-row min-h-screen">
        <div className="flex-1 p-6">
          <div className="overflow-x-auto">
            <div className="flex space-x-3 items-center mb-4">

              <div className="mb-4">
                <label htmlFor="filter" className="mr-2">
                  Filter By Status:
                </label>
                <select
                  id="filter"
                  value={filterOption}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">All</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="searchDate" className="mr-2">
                  Search By Date:
                </label>
                <input
                  type="text"
                  id="searchDate"
                  value={searchDate}
                  onChange={handleDateSearch}
                  className="border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="searchNumber" className="mr-2">
                  Search By Number:
                </label>
                <input
                  type="text"
                  id="searchNumber"
                  value={searchNumber}
                  onChange={handleNumberSearch}
                  className="border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="searchTransactionId" className="mr-2">
                  Search By Transaction ID:
                </label>
                <input
                  type="text"
                  id="searchTransactionId"
                  value={searchTransactionId}
                  onChange={handleTransactionIdSearch}
                  className="border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <button onClick={handleDeleteSelected} className="btn bg-base-300 hover:bg-red-600 btn-danger">
                Delete Selected
              </button>
              <button onClick={downloadCSV} className="btn bg-base-300 hover:bg-blue-600 btn-danger">Download CSV</button>

            </div>
            <div className="table-container">
              {isLoading ? (
                <div className="flex justify-center my-20">
                  <div className="p-3 animate-spin drop-shadow-2xl bg-gradient-to-bl from-pink-400 via-purple-400 to-indigo-600 md:w-32 md:h-32 h-24 w-24 aspect-square rounded-full">
                    <div className="rounded-full h-full w-full bg-base-100 background-blur-md"></div>
                  </div>
                </div>
              ) : (
                <table className="table-auto w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 border-b-2">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-4 border-b-2">Transaction#</th>
                      <th className="p-4 border-b-2">Status</th>
                      <th className="p-4 border-b-2">Date & Time</th>
                      <th className="p-4 border-b-2 hidden sm:table-cell">Number</th>
                      <th className="p-4 border-b-2 hidden sm:table-cell">Pin</th>
                      <th className="p-4 border-b-2">Price</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentTransactions.map((transaction, index) => (
                      <tr key={index}>
                        <td className="p-4 border-b">
                          <input
                            type="checkbox"
                            onChange={(e) => handleCheckboxChange(e, transaction.docId)}
                            checked={selectedTransactionIds.includes(transaction.docId)}
                          />
                        </td>
                        <td
                          onClick={() =>
                            handleTransactionClick(transaction, transaction.docId)
                          }
                          className="cursor-pointer p-4 border-b underline"
                        >
                          {transaction.id}
                          <span className="ml-6">{transaction.transactionId}</span>
                        </td>
                        <td
                          className={`p-4 border-b ${transaction.status === "Rejected"
                            ? "text-red-500"
                            : transaction.status === "Completed"
                              ? "text-green-500"
                              : "text-yellow-500"
                            }`}
                        >
                          {transaction.status}
                        </td>
                        <td className="p-4 border-b">{transaction.dateTime}</td>
                        <td className="p-4 border-b hidden sm:table-cell">{transaction.number}</td>
                        <td className="p-4 border-b hidden sm:table-cell">{transaction.pin}</td>
                        <td className="p-4 font-bold border-b">${transaction.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="btn btn-sm"
            >
              Previous
            </button>
            <div>
              Page {currentPage} of{" "}
              {Math.ceil(filteredTransactions.length / transactionsPerPage)}
            </div>
            <button
              onClick={nextPage}
              disabled={
                currentPage ===
                Math.ceil(filteredTransactions.length / transactionsPerPage)
              }
              className="btn btn-sm"
            >
              Next
            </button>
          </div>
        </div>{modalOpen && (
          <div className="fixed z-10 inset-0 overflow-y-auto flex justify-center items-center bg-black bg-opacity-50">
            <div className="rounded-lg p-8 max-w-2xl w-full">
              {selectedTransaction && (
                <div className="modal-box rounded-lg p-8 max-w-2xl w-full mx-auto my-12 md:my-0 md:mr-12 md:ml-auto border border-gray-300">
                  <h2 className="text-xl text-center font-semibold mb-4">Transaction Details</h2>
                  <form onSubmit={(e) => handleStatusUpdate(e)}>
                    <div className="grid grid-cols-2 gap-x-4 text-lg">
                      <div className="font-semibold">
                        <div className="border-b border-gray-300 mb-2 pb-2">
                          <strong>Transaction #:</strong>
                        </div>
                        <div className="border-b border-gray-300 mb-2 pb-2">
                          <strong>Status:</strong>
                        </div>
                        <div className="border-b border-gray-300 mb-2 pb-2">
                          <strong>Date & Time:</strong>
                        </div>
                        <div className="border-b border-gray-300 mb-2 pb-2">
                          <strong>Number:</strong>
                        </div>
                        <div className="border-b border-gray-300 mb-2 pb-2">
                          <strong>Pin:</strong>
                        </div>
                        <div className="border-b border-gray-300 mb-2 pb-2">
                          <strong>Transaction Id:</strong>
                        </div>
                        <div className="border-b border-gray-300 mb-2 pb-2">
                          <strong>Price:</strong>
                        </div>
                      </div>
                      <div>
                        <div className="border-b border-gray-300 mb-2 pb-2">{selectedTransaction.id}</div>
                        <div className="border-b border-gray-300 mb-2 pb-2">{selectedTransaction.status}</div>
                        <div className="border-b border-gray-300 mb-2 pb-2">{selectedTransaction.dateTime}</div>
                        <div className="border-b border-gray-300 mb-2 pb-2">{selectedTransaction.number}</div>
                        <div className="border-b border-gray-300 mb-2 pb-2">{selectedTransaction.pin}</div>
                        <div className="border-b border-gray-300 mb-2 pb-2">{selectedTransaction.transactionId}</div>
                        <div className="border-b border-gray-300 mb-2 pb-2">${selectedTransaction.price}</div>
                      </div>
                    </div>
                    <label htmlFor="status" className="mr-2">New Status:</label>
                    <div className="flex justify-center mt-4">
                      <select
                        id="status"
                        value={newStatus}
                        onChange={handleStatusChange}
                        className="border w-full border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Select Status</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="flex flex-col mt-4">
                      <label htmlFor="note" className="mr-2">Add Note (optional):</label>
                      <textarea
                        id="note"
                        onChange={handleNoteChange}
                        className="border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                    <button type="submit" className="btn w-full btn-primary mt-4">Update Status</button>
                  </form>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="btn btn-sm  btn-circle btn-ghost absolute right-2 top-2"
                  >
                    ✕
                  </button>
                  {selectedTransaction.notes && selectedTransaction.notes.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Notes:</h3>
                      <ul className="list-disc list-inside">
                        {selectedTransaction.notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div >
    </>
  );
};

export default Dashboard;
