import { useState } from "react";
import { View, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";
import { sendContactEmailReq } from "../requests.js";
import { useToast } from "../components/ToastContext";

const headingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.8rem",
  letterSpacing: "1px",
  color: "#1a1a1a",
};

const bodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 600,
  fontSize: "1.15rem",
  letterSpacing: "0.3px",
  color: "#1a1a1a",
};

const labelStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 600,
  fontSize: "0.95rem",
  color: "#555",
  display: "block",
  marginBottom: "0.4rem",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: "1.05rem",
  border: "1px solid rgba(151, 33, 0, 0.35)",
  borderRadius: "4px",
  backgroundColor: "rgba(255,255,255,0.8)",
  outline: "none",
  boxSizing: "border-box",
  color: "#1a1a1a",
};

const dividerStyle = {
  border: "none",
  borderTop: "1px solid rgba(151, 33, 0, 0.35)",
  margin: "1.5rem 0",
};

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.name || !form.email || !form.message) return;
    if (!emailRegex.test(form.email)) {
        toast("Please enter a valid email address.", "error");
      return;
    }
    setSending(true);
    const data = await sendContactEmailReq(form);
    setSending(false);
    if (!data.success) {
      toast("Something went wrong. Please try again.", "error");
      return;
    }
    toast("Message sent! We'll be in touch soon.", "success");
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />
      <View
        width="100%"
        minHeight="100vh"
        paddingTop="3rem"
        paddingLeft="3rem"
        paddingRight="3rem"
        paddingBottom="4rem"
        style={{
          backgroundImage: `url(${LuxuryBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
        }}
      >
        <div style={{ maxWidth: "780px", margin: "0 auto", paddingTop: "2rem" }}>

          <Text style={headingStyle} marginBottom="0.5rem">
            Contact Us
          </Text>
          <hr style={dividerStyle} />

          {submitted ? (
            <Text style={{ ...bodyStyle, fontStyle: "italic", marginTop: "2rem" }}>
              Thank you for reaching out. We'll get back to you soon.
            </Text>
          ) : (
            <div style={{ marginTop: "1.5rem" }}>

              <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(optional)"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write your message..."
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={sending}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    ...bodyStyle,
                    fontSize: "1rem",
                    padding: "0.9rem 2.2rem",
                    border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: "28px",
                    background: isHovered ? "linear-gradient(145deg,  #c23434, rgba(20,20,20,0.9))" : "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                    color: "#FFFFFF",
                    cursor: sending ? "not-allowed" : "pointer",
                    opacity: sending ? 0.7 : 1,
                    boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                    transform: isHovered ? "translateY(-5px)" : "translateY(0px)",
                    transition: "all 1s ease",
                }}>
                <Text style={{...bodyStyle, color: "#FFFFFF"}}>{sending ? "Sending..." : "Send"}</Text>
              </button>
            </div>
          )}

        </div>
      </View>
    </>
  );
}