import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./PortsTable.css";

const PortsTable = () => {
  const [portsData, setPortsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState([
    "name",
    "city",
    "country",
    "province",
    "timezone",
    "coordinates",
    "code",
    "unlocs",
  ]);
  const [filters, setFilters] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);
  const popupRef = useRef(null);

  useEffect(() => {
    const fetchPortsData = async () => {
      try {
        const response = await axios.get(
          "https://raw.githubusercontent.com/marchah/sea-ports/refs/heads/master/lib/ports.json"
        );
        setPortsData(Object.values(response.data));
      } catch (error) {
        console.error("Error fetching ports data:", error);
      }
    };

    fetchPortsData();
  }, []);

  const flattenObject = (obj, prefix = "") => {
    return Object.keys(obj).reduce((acc, key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        Object.assign(acc, flattenObject(obj[key], fullKey));
      } else {
        acc[fullKey] = obj[key];
      }
      return acc;
    }, {});
  };

  const handleSearch = (data) => {
    return data.filter((port) => {
      const flattenedPort = flattenObject(port);
      return Object.values(flattenedPort).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const applyFilters = (data) => {
    let filteredData = data;
    Object.keys(filters).forEach((column) => {
      if (filters[column]) {
        filteredData = filteredData.filter((row) =>
          row[column]?.toString().includes(filters[column])
        );
      }
    });
    return filteredData;
  };

  const filteredData = applyFilters(handleSearch(portsData));
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const getPaginationRange = () => {
    const range = [];
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      range.push(i);
    }
    return range;
  };

  const handleColumnToggle = (column) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const handleFilterChange = (column, value) => {
    setFilters({ ...filters, [column]: value });
  };

  const resetFilterColumn = (column) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };
  const getFilterOptions = (column) => {
    const filteredData = applyFilters(portsData);
    const allValues = portsData.map((port) => port[column]);
    const filteredValues = filteredData.map((port) => port[column]);
    
    // Show all options when the active column is clicked again
    return activeFilterColumn === column ? [...new Set(allValues)] : [...new Set(filteredValues)];
  };
  

  const handleOutsideClick = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      setShowColumnSelector(false);
      setShowFilterPopup(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="table-container">
      <div className="controls">
        <input
          type="text"
          placeholder="Search..."
          className="search-box"
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
          className="control-button"
          onClick={() => setShowColumnSelector(!showColumnSelector)}
        >
          Select Columns
        </button>

        <button
          className="control-button"
          onClick={() => setShowFilterPopup(!showFilterPopup)}
        >
          Apply Filters
        </button>
      </div>

      {showColumnSelector && (
        <div className="popup" ref={popupRef}>
          <h4>Select Columns</h4>
          {["name", "city", "country", "province", "timezone", "coordinates", "code", "unlocs"].map(
            (column) => (
              <div key={column} className="popup-option">
                <label>
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column)}
                    onChange={() => handleColumnToggle(column)}
                  />
                  {column}
                </label>
              </div>
            )
          )}
        </div>
      )}

      {showFilterPopup && (
        <div className="popup" ref={popupRef}>
          <h4>Apply Filters</h4>
          {["country", "city", "province", "timezone"].map((column) => (
            <div key={column} className="popup-option">
              <label>{column}</label>
              <select
                value={filters[column] || ""}
                onChange={(e) => handleFilterChange(column, e.target.value)}
                onClick={() => setActiveFilterColumn(column)}
              >
                <option value="">All</option>
                {getFilterOptions(column)
                  .filter((val) => val)
                  .map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
              </select>
              {filters[column] && (
                <button onClick={() => resetFilterColumn(column)}>Reset</button>
              )}
            </div>
          ))}
        </div>
      )}

      <table className="ports-table">
        <thead>
          <tr>
            {visibleColumns.map((column) => (
              <th key={column}>{column.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((port, index) => (
            <tr key={index}>
              {visibleColumns.map((column) => (
                <td key={column}>
                  {Array.isArray(port[column])
                    ? port[column].join(", ")
                    : port[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        {getPaginationRange().map((page) => (
          <button
            key={page}
            className={currentPage === page ? "active" : ""}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PortsTable;
