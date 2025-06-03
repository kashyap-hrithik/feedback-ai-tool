// src/components/FeedbackModal.tsx
import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { supabase } from "../supabaseClient";
import { dataURLtoFile } from "../utils/fileHelpers";
import type { HighlightRect, FeedbackCategory, AIFeedback } from "../types";
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  MousePointer2,
  CameraOff,
  Zap,
  Lightbulb,
  MessageSquare as ModalIcon,
} from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(
    null
  );
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(
    null
  );
  const [imageDimensions, setImageDimensions] = useState<{
    width: number; // Displayed width of the image
    height: number; // Displayed height of the image
    naturalWidth: number;
    naturalHeight: number;
  } | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const overlayContainerRef = useRef<HTMLDivElement>(null);

  const [comment, setComment] = useState("");
  const [feedbackCategory, setFeedbackCategory] =
    useState<FeedbackCategory>("feedback");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatusMessage, setSubmissionStatusMessage] = useState<
    string | null
  >(null); // New state for status messages
  const [aiResponse, setAiResponse] = useState<AIFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const resetState = () => {
    console.log("FeedbackModal: resetState called");
    setScreenshotDataUrl(null);
    setIsCapturing(false);
    setIsDrawing(false);
    setStartPoint(null);
    setHighlightRect(null);
    setImageDimensions(null);
    setComment("");
    setFeedbackCategory("feedback");
    setIsSubmitting(false);
    setAiResponse(null);
    setError(null);
    setSubmissionSuccess(false);
    setSubmissionStatusMessage(null); // Reset status message
  };

  const handleCloseAndReset = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    if (isOpen && !isCapturing) {
      if (!screenshotDataUrl) {
        console.log("FeedbackModal: isOpen effect - capturing screenshot");
        captureScreenshot();
      }
    }
    if (!isOpen) {
      if (!submissionSuccess) {
        // resetState(); // Let reset be handled by close button or "Done" after success
      }
    }
  }, [isOpen]);

  const captureScreenshot = async () => {
    console.log("FeedbackModal: captureScreenshot called");
    setIsCapturing(true);
    setError(null);
    setHighlightRect(null);
    setScreenshotDataUrl(null);

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const feedbackToolElements = [
        document.getElementById("feedback-modal-container"),
        document.getElementById("floating-feedback-button"),
      ].filter((el) => el !== null) as HTMLElement[];

      const originalDisplays = feedbackToolElements.map(
        (el) => el.style.display
      );
      feedbackToolElements.forEach((el) => (el.style.display = "none"));
      console.log("FeedbackModal: Elements hidden for screenshot");

      const canvas = await html2canvas(document.documentElement, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        backgroundColor: null,
      });

      feedbackToolElements.forEach(
        (el, index) => (el.style.display = originalDisplays[index])
      );
      console.log("FeedbackModal: Elements restored after screenshot");

      const dataUrl = canvas.toDataURL("image/png");
      console.log(
        "FeedbackModal: Screenshot captured, Data URL length:",
        dataUrl.length
      );
      setScreenshotDataUrl(dataUrl);
      setError(null);
    } catch (err) {
      console.error("FeedbackModal: Error capturing screenshot:", err);
      setError("Failed to capture screenshot. Please try again.");
      setScreenshotDataUrl(null);
    } finally {
      setIsCapturing(false);
      console.log(
        "FeedbackModal: captureScreenshot finished, isCapturing set to false"
      );
    }
  };

  const handleImageLoad = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const img = event.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      const newDims = {
        width: img.offsetWidth,
        height: img.offsetHeight,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      };
      setImageDimensions(newDims);
      console.log("FeedbackModal: handleImageLoad - Dimensions set", newDims);
    } else {
      console.warn("FeedbackModal: handleImageLoad - Image has no dimensions.");
      setImageDimensions(null);
    }
  };

  const getMousePosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      !overlayContainerRef.current ||
      !imageDimensions ||
      imageDimensions.width === 0 ||
      imageDimensions.height === 0
    ) {
      console.warn(
        "FeedbackModal: getMousePosition - No overlayContainerRef or imageDimensions (or displayed dimensions are zero)."
      );
      return { x: 0, y: 0 };
    }
    const overlayRect = overlayContainerRef.current.getBoundingClientRect();

    const mouseXInOverlay = e.clientX - overlayRect.left;
    const mouseYInOverlay = e.clientY - overlayRect.top;

    const scaleX = imageDimensions.naturalWidth / imageDimensions.width;
    const scaleY = imageDimensions.naturalHeight / imageDimensions.height;

    const naturalX = mouseXInOverlay * scaleX;
    const naturalY = mouseYInOverlay * scaleY;

    return { x: naturalX, y: naturalY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      !screenshotDataUrl ||
      submissionSuccess ||
      isSubmitting ||
      !imageDimensions
    ) {
      console.log(
        "FeedbackModal: handleMouseDown - Aborting draw (conditions not met)"
      );
      return;
    }
    e.preventDefault();
    setError(null);
    const pos = getMousePosition(e);
    console.log("FeedbackModal: handleMouseDown - Start natural coords", pos);
    setStartPoint(pos);
    setIsDrawing(true);
    setHighlightRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !imageDimensions) return;
    e.preventDefault();
    const currentPos = getMousePosition(e);
    setHighlightRect({
      x: Math.min(startPoint.x, currentPos.x),
      y: Math.min(startPoint.y, currentPos.y),
      width: Math.abs(startPoint.x - currentPos.x),
      height: Math.abs(startPoint.y - currentPos.y),
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawing) {
      e.preventDefault();
      setIsDrawing(false);
      console.log(
        "FeedbackModal: handleMouseUp - Drawing finished. Final highlightRect (natural coords):",
        highlightRect
      );
    }
  };

  const handleSubmit = async () => {
    if (!supabase) {
      setError("Supabase client not initialized.");
      return;
    }
    if (!screenshotDataUrl || !comment) {
      setError("Screenshot and comment are required.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatusMessage("Preparing feedback..."); // Initial status
    setError(null);
    setAiResponse(null);
    setSubmissionSuccess(false);

    try {
      setSubmissionStatusMessage("Uploading screenshot...");
      const imageFile = await dataURLtoFile(
        screenshotDataUrl,
        `feedback-${Date.now()}.png`
      );
      const filePath = `public/${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}-${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(filePath, imageFile, { cacheControl: "3600", upsert: false });
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

      console.log(
        "FeedbackModal: Submitting highlightRect to backend:",
        highlightRect
      );
      setSubmissionStatusMessage("Analyzing with AI...");

      const { data: functionResponse, error: functionError } =
        await supabase.functions.invoke("process-feedback", {
          body: {
            screenshot_path: uploadData.path,
            user_comment: comment,
            highlight_coordinates: highlightRect,
            feedback_category: feedbackCategory,
            page_url: window.location.href,
          },
        });

      if (functionError) {
        let errorDetail = functionError.message || "Unknown function error";
        if (typeof functionError === "object" && functionError !== null) {
          const context = (
            functionError as { context?: { json?: { error?: string } } }
          ).context;
          if (
            context &&
            typeof context === "object" &&
            context.json &&
            typeof context.json === "object" &&
            context.json.error
          ) {
            errorDetail = context.json.error;
          }
        }
        console.error(
          "FeedbackModal: Function invocation error object:",
          functionError
        );
        throw new Error(`Function Error: ${errorDetail}`);
      }
      if (functionResponse.error)
        throw new Error(`AI Processing Error: ${functionResponse.error}`);

      setSubmissionStatusMessage("Generating response..."); // Or just clear if AI response is quick
      setAiResponse(functionResponse as AIFeedback);
      setSubmissionSuccess(true);
    } catch (err) {
      console.error("FeedbackModal: Submission error:", err);
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message: unknown }).message === "string"
      ) {
        errorMessage = (err as { message: string }).message;
      }
      setError(errorMessage);
      setSubmissionSuccess(false);
    } finally {
      setIsSubmitting(false);
      setSubmissionStatusMessage(null); // Clear status message
    }
  };

  if (!isOpen) return null;

  // --- Styles ---
  const modalBackdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
    padding: "20px",
  };
  const modalContentStyle: React.CSSProperties = {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "680px",
    maxHeight: "calc(100vh - 40px)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    overflow: "hidden",
  };
  const closeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    fontSize: "1.6em",
    cursor: "pointer",
    color: "#9ca3af",
    lineHeight: 1,
    padding: "8px",
    borderRadius: "50%",
  };
  const modalHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#1f2937",
  };
  const iconStyle: React.CSSProperties = {
    color: "#3b82f6",
    marginRight: "10px",
  };

  const screenshotOuterWrapperStyle: React.CSSProperties = {
    width: "100%",
    maxHeight: "350px",
    minHeight: "200px",
    overflow: "hidden",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#f9fafb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "16px",
    position: "relative",
  };

  const drawingSurfaceContainerStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    maxWidth: "100%",
    maxHeight: "100%",
    cursor: "crosshair",
    lineHeight: 0,
    userSelect: "none",
  };

  const imageStyleToApply: React.CSSProperties = {
    display: "block",
    maxWidth: "100%",
    maxHeight: "348px",
    userSelect: "none",
    objectFit: "contain",
    pointerEvents: "none",
  };

  const highlightBoxStyleToApply: React.CSSProperties = {
    position: "absolute",
    border: "2px solid #ef4444",
    backgroundColor: "rgba(239,68,68,0.25)",
    pointerEvents: "none",
    zIndex: 2,
  };
  const promptTextStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(255, 255, 255, 0.95)", // More opaque background
    padding: "8px 12px", // Increased padding
    borderRadius: "6px",
    fontSize: "13px", // Slightly larger font for prompt
    color: "#374151", // Darker text for better contrast (Tailwind gray-700)
    pointerEvents: "none",
    zIndex: 3,
    boxShadow: "0 2px 5px rgba(0,0,0,0.15)", // Slightly stronger shadow
    textAlign: "center",
    display: "flex",
    alignItems: "center", // Vertically align icon and text
  };
  const textareaStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    minHeight: "100px",
    maxHeight: "150px",
    overflowY: "auto",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    marginBottom: "16px",
    boxSizing: "border-box",
    fontSize: "14px",
    lineHeight: "1.6",
    resize: "vertical",
  };
  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  };
  const categoryButtonStyleBase: React.CSSProperties = {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 500,
    flexGrow: 1,
    transition: "background-color 0.2s, color 0.2s, box-shadow 0.2s",
  };
  const categoryButtonStyleActive: React.CSSProperties = {
    ...categoryButtonStyleBase,
    backgroundColor: "#2563eb",
    color: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };
  const categoryButtonStyleInactive: React.CSSProperties = {
    ...categoryButtonStyleBase,
    backgroundColor: "#e5e7eb",
    color: "#374151",
    boxShadow: "none",
  };
  const submitButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#1d4ed8",
    color: "white",
    fontSize: "15px",
    fontWeight: 600,
    transition: "background-color 0.2s, opacity 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const successMessageStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "20px",
  };
  const errorMessageStyle: React.CSSProperties = {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "12px",
    borderRadius: "6px",
    marginTop: "16px",
    fontSize: "14px",
  };

  return (
    <div id="feedback-modal-container" style={modalBackdropStyle}>
      <div id="feedback-modal-content-inner" style={modalContentStyle}>
        <button
          onClick={handleCloseAndReset}
          style={closeButtonStyle}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {!submissionSuccess ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              overflow: "hidden",
            }}
          >
            <div style={modalHeaderStyle}>
              <ModalIcon size={22} style={iconStyle} /> Provide Feedback
            </div>

            <div
              style={{
                flexGrow: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                paddingRight: "8px",
                marginRight: "-8px",
              }}
            >
              {isCapturing && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "50px 0",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader2
                    size={36}
                    style={{
                      animation: "spin 1s linear infinite",
                      color: "#2563eb",
                      marginBottom: "10px",
                    }}
                  />
                  <p style={{ color: "#4a5568" }}>Capturing screen...</p>
                </div>
              )}

              {!isCapturing && screenshotDataUrl && (
                <div style={screenshotOuterWrapperStyle}>
                  <div
                    ref={overlayContainerRef}
                    style={drawingSurfaceContainerStyle}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      ref={imageRef}
                      src={screenshotDataUrl}
                      alt="Screenshot"
                      style={imageStyleToApply}
                      onLoad={handleImageLoad}
                      draggable="false"
                    />
                    {highlightRect && imageDimensions && (
                      <div
                        style={{
                          ...highlightBoxStyleToApply,
                          left: `${
                            (highlightRect.x / imageDimensions.naturalWidth) *
                            imageDimensions.width
                          }px`,
                          top: `${
                            (highlightRect.y / imageDimensions.naturalHeight) *
                            imageDimensions.height
                          }px`,
                          width: `${
                            (highlightRect.width /
                              imageDimensions.naturalWidth) *
                            imageDimensions.width
                          }px`,
                          height: `${
                            (highlightRect.height /
                              imageDimensions.naturalHeight) *
                            imageDimensions.height
                          }px`,
                        }}
                      />
                    )}
                    {!highlightRect && !isDrawing && imageDimensions && (
                      <div style={promptTextStyle}>
                        <MousePointer2
                          size={14}
                          style={{
                            marginRight: "6px",
                            display: "inline-block",
                            verticalAlign: "middle",
                            color: "#4b5569",
                            flexShrink: 0,
                          }}
                        />
                        Click and drag to highlight
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isCapturing && !screenshotDataUrl && !error && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "50px 0",
                    border: "2px dashed #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CameraOff
                    size={36}
                    style={{ color: "#9ca3af", marginBottom: "15px" }}
                  />
                  <p
                    style={{
                      marginBottom: "15px",
                      color: "#4b5569",
                      fontSize: "14px",
                    }}
                  >
                    Taking screenshot...
                  </p>
                </div>
              )}

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe the issue or your idea..."
                style={{
                  ...textareaStyle,
                  marginTop: screenshotDataUrl ? "16px" : "0px",
                }}
                disabled={isSubmitting}
              />
            </div>

            <div
              style={{
                marginTop: "auto",
                paddingTop: "20px",
                borderTop: "1px solid #e5e7eb",
                flexShrink: 0,
              }}
            >
              <div style={buttonGroupStyle}>
                <button
                  onClick={() => setFeedbackCategory("feedback")}
                  disabled={isSubmitting}
                  style={
                    feedbackCategory === "feedback"
                      ? categoryButtonStyleActive
                      : categoryButtonStyleInactive
                  }
                >
                  <Zap
                    size={14}
                    style={{
                      marginRight: "6px",
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  />
                  Issue / Feedback
                </button>
                <button
                  onClick={() => setFeedbackCategory("feature_request")}
                  disabled={isSubmitting}
                  style={
                    feedbackCategory === "feature_request"
                      ? {
                          ...categoryButtonStyleActive,
                          backgroundColor: "#10b981",
                        }
                      : categoryButtonStyleInactive
                  }
                >
                  <Lightbulb
                    size={14}
                    style={{
                      marginRight: "6px",
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  />
                  Idea / Feature
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !comment || !screenshotDataUrl}
                style={{
                  ...submitButtonStyle,
                  opacity:
                    isSubmitting || !comment || !screenshotDataUrl ? 0.6 : 1,
                  cursor:
                    isSubmitting || !comment || !screenshotDataUrl
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      size={18}
                      style={{
                        animation: "spin 1s linear infinite",
                        marginRight: "8px",
                      }}
                    />
                    {submissionStatusMessage || "Processing..."}
                  </>
                ) : (
                  "Send Feedback"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              ...successMessageStyle,
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <CheckCircle2
              size={52}
              style={{ color: "#22c55e", margin: "0 auto 20px auto" }}
            />
            <h3
              style={{
                fontSize: "1.75rem",
                fontWeight: 600,
                marginBottom: "10px",
                color: "#1f2937",
              }}
            >
              Feedback Sent!
            </h3>
            <p
              style={{
                color: "#4b5563",
                marginBottom: "24px",
                fontSize: "15px",
              }}
            >
              Here's the AI analysis:
            </p>
            {aiResponse?.summary && (
              <div
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                  textAlign: "left",
                  border: "1px solid #e5e7eb",
                }}
              >
                <strong
                  style={{
                    color: "#1f2937",
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Summary:
                </strong>{" "}
                <span style={{ color: "#374151", fontSize: "14px" }}>
                  {aiResponse.summary}
                </span>
              </div>
            )}
            {aiResponse?.suggested_fix && (
              <div
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  textAlign: "left",
                  border: "1px solid #e5e7eb",
                }}
              >
                <strong
                  style={{
                    color: "#1f2937",
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Suggestion:
                </strong>{" "}
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    margin: 0,
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  {aiResponse.suggested_fix}
                </pre>
              </div>
            )}
            <button
              onClick={handleCloseAndReset}
              style={{
                ...submitButtonStyle,
                backgroundColor: "#2563eb",
                marginTop: "28px",
                display: "inline-block",
                width: "auto",
                padding: "10px 30px",
                margin: "28px auto 0 auto",
              }}
            >
              Done
            </button>
          </div>
        )}
        {error && !isCapturing && !submissionSuccess && (
          <div
            style={{
              ...errorMessageStyle,
              position: "fixed",
              bottom: "30px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1002,
              width: "auto",
              maxWidth: "calc(100% - 40px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <AlertTriangle
                size={16}
                style={{ marginRight: "8px", flexShrink: 0 }}
              />{" "}
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
