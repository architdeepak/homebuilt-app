import React, { useState } from "react";
import "./App.css";
import logo from "./logo.png"; // Ensure logo.png is in the src folder

function App() {
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Benji AI. Upload an image and ask questions about it.", sender: "ai" },
  ]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null); // Holds uploaded image
  const [imagePreview, setImagePreview] = useState(null); // Holds the image preview URL
  const [loading, setLoading] = useState(false);
  const [isImageEditor, setIsImageEditor] = useState(false); // Track if we're in Image Editor mode

  const handleSend = async () => {
    if (!input.trim() && !image) return;

    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      let chatResponse = null;

      if (image && isImageEditor) {
        // Send image to Gemini Text-based Image Editor API
        const formData = new FormData();
        formData.append("image", image);
        formData.append("instruction", input);

        const imageRes = await fetch("http://localhost:5000/api/edit-image", {
          method: "POST",
          body: JSON.stringify({ image: await fileToBase64(image), instruction: input }),
          headers: { "Content-Type": "application/json" },
        });

        const imageData = await imageRes.json();
        
        // Use the image URL returned from the backend to update the image preview
        const editedImageUrl = imageData.result[0]?.url;

        if (editedImageUrl) {
          setImagePreview(editedImageUrl);  // Set the image preview to the edited image URL
          chatResponse = `Edited the image!`;
        } else {
          chatResponse = "⚠️ Error with image editing.";
        }
      } else {
        // Send text to Gemini API for chat
        const chatRes = await fetch("http://localhost:5000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input }),
        });

        const chatData = await chatRes.json();
        chatResponse = chatData.reply;
      }

      setMessages((prev) => [...prev, { text: chatResponse, sender: "ai" }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { text: "⚠️ Error connecting to Benji AI.", sender: "ai" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);

    // Create a URL for the image to be shown as a preview
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModelSwitch = () => {
    setIsImageEditor(!isImageEditor);
  };

  // Convert image to base64 to send to the backend
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="App">
      <div className="main-content">
        {/* Chat Box */}
        <div className="chat-container">
          <div className="chat-header">Benji AI – Your DIY Assistant</div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}-message`}>
                {msg.sender === "ai" && (
                  <img src={logo} alt="Benji" className="avatar" />
                )}
                <div className="bubble">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="message ai-message">
                <img src={logo} alt="Benji" className="avatar" />
                <div className="bubble">Benji is typing...</div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <label htmlFor="file-upload" className="upload-icon">📎</label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange} // Update image preview
            />
          </div>

          {/* Switch Models Button */}
          <button onClick={handleModelSwitch} className="switch-model-btn">
            O {isImageEditor ? "1" : "2"}
          </button>
        </div>

        {/* Image Preview - Always Displayed */}
        {imagePreview && (
          <div className="image-viewer">
            <div className="image-header">Image Preview</div>
            <div className="image-box">
              <img src={imagePreview} alt="Uploaded Image" className="image-preview" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
