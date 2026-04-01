"use client"

import { useEffect, useState } from "react";
import "./globals.css";
import { saveFile, getFiles, deleteFile } from "./db";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectnote, setSelectnote] = useState(null);

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [search, setSearch] = useState("");
  const [find, setFind] = useState("");
  const [filter, setFilter] = useState("all");

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("notes");
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, []);

  // Load files from IndexedDB
  useEffect(() => {
    const loadFiles = async () => {
      const allFiles = await getFiles();
      setFiles(allFiles);
    };
    loadFiles();
  }, []);

  // --- Notes functions ---
  const handlecreatenote = () => {
    if (isCreating) {
      alert("Note is already created.");
      return;
    }
    const newnotes = { id: Date.now(), title: "Create New notes", topic: "", content: "" };
    setNotes(prev => [...prev, newnotes]);
    setSelectnote(newnotes);
    setIsCreating(true);
  };

  const handledeletenote = (id) => {
    const updated = notes.filter(note => note.id !== id);
    setNotes(updated);
    localStorage.setItem("notes", JSON.stringify(updated));
    setSelectedFile(null);
    setSelectnote(null);
    setIsCreating(false);
  };

  const handlesavenotes = () => {
    if (!selectnote) return;
    const updated = [...notes];
    const index = updated.findIndex(n => n.id === selectnote.id);
    if (index !== -1) updated[index] = selectnote;
    else updated.push(selectnote);

    setNotes(updated);
    localStorage.setItem("notes", JSON.stringify(updated));
    alert("Saved Notes");
    setSelectnote(null);
    setIsCreating(false);
  };

  // --- Files functions ---
  const handlefile = (e) => {
    const selectfiles = Array.from(e.target.files);

    selectfiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = async () => {
        const newFile = {
          name: file.name,
          type: file.type,
          data: reader.result,
          star: false
        };

        setFiles(prev => [...prev, newFile]);
        await saveFile(newFile);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleStar = async (index) => {
    const updated = [...files];
    updated[index].star = !updated[index].star;
    setFiles(updated);
    await saveFile(updated[index]);
  };

  const removeFile = async (index) => {
    const fileToRemove = files[index];
    await deleteFile(fileToRemove.name);
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- Filtering ---
  const filteredFiles = files.filter((file) => {
    const matchSearch = (file.name || "").toLowerCase().includes(search.toLowerCase());
    if (filter === "pdf") return matchSearch && file.type === "application/pdf";
    if (filter === "image") return matchSearch && file.type?.startsWith("image/");
    return matchSearch;
  });

  const filteredNotes = notes.filter(note =>
    (note.topic || "").toLowerCase().includes(find.toLowerCase())
  );

  // --- Render ---
  return (
    <div>
      <div className="gridContainer">
        {/* Notes Sidebar */}
        <div>
          <h1 className="first">
            <img src="notes.png" alt="logo" width={40} height={40} /> Mero तिपोट
          </h1>
          <input
            className="textai"
            style={{ marginLeft: 40, marginTop: 40 }}
            placeholder="Search Notes..."
            value={find}
            onChange={e => setFind(e.target.value)}
          />
          <div className="store">
            <h1 style={{ color: "purple", textAlign: "center", padding: 8 }}>Notes</h1>
            <ol>
              {filteredNotes.map(note => (
                <li
                  className="notebox"
                  key={note.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => { setSelectnote(note); setSelectedFile(null); }}
                >
                  {note.topic || "untitled"}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Main Content */}
        <div className="second">
          {selectedFile ? (
            <div className="preview">
              <h2 className="head">{selectedFile.name}</h2>
              {selectedFile.type.startsWith("image/") && (
                <img src={selectedFile.data} className="images" style={{ maxWidth: "60%" }} />
              )}
             {selectedFile.type === "application/pdf" && (
  <iframe
    src={URL.createObjectURL(
      new Blob([Uint8Array.from(atob(selectedFile.data.split(',')[1]), c => c.charCodeAt(0))], 
      { type: "application/pdf" })
    )}
    width="100%"
    height="500px"
  ></iframe>
)}
              <button className="Btns" onClick={() => setSelectedFile(null)}>Close</button>
            </div>
          ) : selectnote ? (
            <div className="notesgrid">
              <div className="noteBox" key={selectnote.id}>
                <h1 className="ais">{selectnote.title}</h1>
                <div>
                  <h3 className="text">Title</h3>
                  <input
                    type="text"
                    placeholder="Enter title"
                    className="inputt"
                    value={selectnote.topic}
                    onChange={(e) => setSelectnote({ ...selectnote, topic: e.target.value })}
                  />
                </div>
                <div>
                  <h3 className="text">Content</h3>
                  <textarea
                    className="texta"
                    placeholder="Start typing your notes here..."
                    value={selectnote.content}
                    onChange={(e) => setSelectnote({ ...selectnote, content: e.target.value })}
                  ></textarea>
                </div>
                <div className="button" style={{ textAlign: "end", paddingRight: 25 }}>
                  <button className="Btns" onClick={() => handledeletenote(selectnote.id)}>Delete Note</button>
                  <button className="Btns" onClick={handlesavenotes}>Save Note</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="page">
              <img src="note.webp" alt="logo" width={700} height={500} className="img" />
              <h3 className="hero">Your Academic Hub</h3>
              <p className="heros">
                Select a note to view, upload a new PDF, or start asking AI questions across all your materials.
              </p>
              <div className="button">
                <button className="Btns" onClick={handlecreatenote}>Write Note</button>
                <input
                  type="file"
                  id="fileupload"
                  style={{ display: "none" }}
                  accept=".pdf,image/*"
                  multiple
                  onChange={handlefile}
                />
                <button className="Btns" onClick={() => document.getElementById("fileupload").click()}>
                  Upload Material
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Files Sidebar */}
        <div className="third">
          <div className="we">
            <h1 className="ai">Document Hub</h1>
          </div>
          <input
            className="textai"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginTop: 40 }}
          />
          <div className="filters">
            <button onClick={() => setFilter("all")} className="but">All</button>
            <button onClick={() => setFilter("pdf")} className="but">PDF</button>
            <button onClick={() => setFilter("image")} className="but">Images</button>
          </div>
          <div className="fileList">
            {filteredFiles.map((file, index) => (
              <div className="fileCard" key={index}>
                <p
                  style={{ cursor: "pointer" }}
                  onClick={() => { setSelectedFile(file); setSelectnote(null); }}
                >
                  {file.name}
                </p>
                <div className="actions">
                  <button onClick={() => toggleStar(index)}>{file.star ? "⭐" : "☆"}</button>
                  <button onClick={() => removeFile(index)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}