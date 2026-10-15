import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  Clock3,
  Expand,
  Info,
  LoaderCircle,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
  Video,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import axiosClient, { tokenStorage } from "../../api/axios";
import appointmentService from "../../services/appointment.service";
import "../../styles/consultation-room.css";

function iceServers() {
  const parse = (value) => (value || "").split(",").map((item) => item.trim()).filter(Boolean);
  const servers = [];
  const stun = parse(import.meta.env.VITE_WEBRTC_STUN_URLS);
  const turn = parse(import.meta.env.VITE_WEBRTC_TURN_URLS);
  if (stun.length) servers.push({ urls: stun });
  if (turn.length) servers.push({
    urls: turn,
    username: import.meta.env.VITE_WEBRTC_TURN_USERNAME,
    credential: import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL,
  });
  return servers;
}

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function formatElapsed(startedAt) {
  if (!startedAt) return "00:00";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function VideoPlaceholder({ name, message, compact = false }) {
  return (
    <div className={`consult-video-placeholder${compact ? " is-compact" : ""}`}>
      <div className="consult-avatar">{getInitials(name)}</div>
      {!compact && <><strong>{name || "Người tham gia"}</strong><span>{message}</span></>}
    </div>
  );
}

function ConnectionPill({ state, connected }) {
  const Icon = connected ? Wifi : state === "Mất kết nối" ? WifiOff : LoaderCircle;
  return (
    <span className={`consult-connection-pill${connected ? " is-connected" : state === "Mất kết nối" ? " is-lost" : " is-waiting"}`}>
      <Icon size={14} className={!connected && state !== "Mất kết nối" ? "consult-spin" : ""} />
      {state}
    </span>
  );
}

export default function ConsultationRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingIce = useRef([]);
  const finishInProgress = useRef(false);
  const [session, setSession] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [connection, setConnection] = useState("Đang xác minh quyền truy cập");
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [microphoneOn, setMicrophoneOn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [elapsed, setElapsed] = useState("00:00");
  const [devices, setDevices] = useState([]);
  const [deviceError, setDeviceError] = useState("");
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMicrophone, setSelectedMicrophone] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const user = tokenStorage.getUser();
  const isDoctor = user?.role?.name === "Doctor";
  const myName = isDoctor ? appointment?.doctor_name : appointment?.patient_name;
  const peerName = isDoctor ? appointment?.patient_name : appointment?.doctor_name;
  const roleLabel = isDoctor ? "Bác sĩ" : "Bệnh nhân";
  const peerRoleLabel = isDoctor ? "Bệnh nhân" : "Bác sĩ";
  const canChooseSpeaker = typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;
  const dateTimeLabel = useMemo(() => {
    if (!appointment) return "Chưa có thông tin lịch hẹn";
    const date = appointment.date_display || appointment.work_date || "";
    return `${date}${appointment.time ? ` · ${appointment.time}` : ""}`;
  }, [appointment]);

  const closeMedia = useCallback(() => {
    const socket = socketRef.current;
    socket?.emit("consultation:leave");
    socket?.removeAllListeners();
    socket?.disconnect();
    socketRef.current = null;
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
    }
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const available = await navigator.mediaDevices.enumerateDevices();
    setDevices(available);
    const camera = available.find((device) => device.kind === "videoinput");
    const microphone = available.find((device) => device.kind === "audioinput");
    setSelectedCamera((current) => current || camera?.deviceId || "");
    setSelectedMicrophone((current) => current || microphone?.deviceId || "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    let socket;
    let peer;
    let stream;

    const setup = async () => {
      try {
        setConnection("Đang xác minh quyền truy cập");
        const [sessionResponse, appointmentData] = await Promise.all([
          axiosClient.get(`/consultations/${id}`),
          appointmentService.getAppointmentById(id),
        ]);
        if (cancelled) return;
        const currentSession = sessionResponse.data.data;
        setSession(currentSession);
        if (currentSession.started_at) setCallStartedAt(new Date(currentSession.started_at).getTime());
        setAppointment(appointmentData);
        await axiosClient.post(`/consultations/${id}/start`);
        if (cancelled) return;
        setConnection(`Đang chờ ${isDoctor ? "bệnh nhân" : "bác sĩ"} tham gia`);

        const mediaTracks = [];
        const mediaWarnings = [];
        try {
          const audioCapture = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          mediaTracks.push(...audioCapture.getAudioTracks());
        } catch (mediaError) {
          mediaWarnings.push(mediaError.name === "NotFoundError" ? "Không tìm thấy microphone." : "Microphone chưa được cấp quyền hoặc không khả dụng.");
        }
        try {
          const videoCapture = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
          mediaTracks.push(...videoCapture.getVideoTracks());
        } catch (mediaError) {
          mediaWarnings.push(mediaError.name === "NotFoundError" ? "Không tìm thấy camera." : "Camera chưa được cấp quyền hoặc không khả dụng.");
        }
        if (!mediaTracks.length) {
          const permissionError = new Error("Hãy cấp quyền cho ít nhất camera hoặc microphone để tham gia cuộc gọi.");
          permissionError.name = mediaWarnings.some((warning) => warning.includes("chưa được cấp quyền")) ? "NotAllowedError" : "NotFoundError";
          throw permissionError;
        }
        stream = new MediaStream(mediaTracks);
        if (mediaWarnings.length) setDeviceError(mediaWarnings.join(" "));
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        localStreamRef.current = stream;
        setCameraOn(stream.getVideoTracks().some((track) => track.enabled));
        setMicrophoneOn(stream.getAudioTracks().some((track) => track.enabled));
        if (!stream.getVideoTracks().length) setDeviceError("Không tìm thấy camera. Bạn vẫn có thể tham gia bằng âm thanh.");
        if (!stream.getAudioTracks().length) setDeviceError("Không tìm thấy microphone. Bạn vẫn có thể tham gia bằng video.");
        if (localVideo.current) localVideo.current.srcObject = stream;
        await refreshDevices();

        peer = new RTCPeerConnection({ iceServers: iceServers() });
        pcRef.current = peer;
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
        peer.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteVideo.current && remoteStream) remoteVideo.current.srcObject = remoteStream;
          if (event.track.kind === "video") {
            setRemoteHasVideo(true);
            event.track.onmute = () => setRemoteHasVideo(false);
            event.track.onunmute = () => setRemoteHasVideo(true);
            event.track.onended = () => setRemoteHasVideo(false);
          }
        };
        peer.onicecandidate = (event) => {
          if (event.candidate) socket?.emit("webrtc:ice-candidate", { appointmentId: Number(id), data: event.candidate });
        };
        peer.onconnectionstatechange = () => {
          const state = peer.connectionState;
          setConnected(state === "connected");
          if (state === "connected") {
            setCallStartedAt((value) => value || Date.now());
            setConnection("Đã kết nối");
          }
          else if (state === "disconnected") setConnection("Đang kết nối lại");
          else if (state === "failed") setConnection("Mất kết nối");
          else if (state === "connecting") setConnection("Đang kết nối media");
        };

        socket = io(import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/, ""), {
          auth: { token: tokenStorage.getAccessToken() },
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;
        const sendOffer = async () => {
          if (!isDoctor || peer.signalingState !== "stable") return;
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("webrtc:offer", { appointmentId: Number(id), data: offer });
        };
        socket.on("connect", () => {
          setError("");
          socket.emit("consultation:join", { appointmentId: Number(id) }, (result) => {
            if (!result?.ok) {
              setError(result?.message || "Bạn không có quyền tham gia phòng tư vấn này.");
              setConnection("Không thể tham gia phòng");
              return;
            }
            setSession((prior) => ({ ...prior, ...result.session }));
            setConnection(result.peerPresent ? "Đang thiết lập cuộc gọi" : `Đang chờ ${isDoctor ? "bệnh nhân" : "bác sĩ"} tham gia`);
            if (result.peerPresent && isDoctor) void sendOffer().catch(() => setError("Không thể bắt đầu kết nối video. Vui lòng thử kết nối lại."));
          });
        });
        socket.on("disconnect", () => {
          setConnected(false);
          setConnection("Đang kết nối lại");
        });
        socket.on("connect_error", () => {
          setError("Không thể kết nối phòng tư vấn. Hãy kiểm tra mạng hoặc đăng nhập lại.");
          setConnection("Mất kết nối");
        });
        socket.on("consultation:peer-joined", () => {
          setConnection("Đang thiết lập cuộc gọi");
          void sendOffer().catch(() => setError("Không thể bắt đầu kết nối video. Vui lòng thử kết nối lại."));
        });
        socket.on("consultation:peer-left", () => {
          setConnected(false);
          setRemoteHasVideo(false);
          setConnection("Đối phương đã rời phòng · đang chờ kết nối lại");
        });
        socket.on("consultation:status", (event = {}) => {
          const { status: nextStatus } = event;
          setSession((prior) => ({ ...prior, status: nextStatus }));
          if (nextStatus === "COMPLETED") {
            setConnection("Buổi tư vấn đã kết thúc");
            if (!isDoctor) {
              closeMedia();
              navigate(`/consultations/${id}/ended`, {
                replace: true,
                state: { session: { ...event, status: nextStatus } },
              });
            }
          }
          else if (nextStatus === "RECONNECTING") setConnection("Đang kết nối lại");
          else if (nextStatus === "IN_PROGRESS") setConnection("Cuộc gọi đang diễn ra");
        });
        socket.on("webrtc:offer", async ({ data }) => {
          try {
            await peer.setRemoteDescription(data);
            for (const candidate of pendingIce.current.splice(0)) await peer.addIceCandidate(candidate);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("webrtc:answer", { appointmentId: Number(id), data: answer });
          } catch { setError("Không thể tiếp nhận kết nối video. Hãy thử kết nối lại."); }
        });
        socket.on("webrtc:answer", async ({ data }) => {
          try {
            await peer.setRemoteDescription(data);
            for (const candidate of pendingIce.current.splice(0)) await peer.addIceCandidate(candidate);
          } catch { setError("Không thể hoàn tất kết nối video. Hãy thử kết nối lại."); }
        });
        socket.on("webrtc:ice-candidate", async ({ data }) => {
          try {
            const candidate = new RTCIceCandidate(data);
            if (peer.remoteDescription) await peer.addIceCandidate(candidate);
            else pendingIce.current.push(candidate);
          } catch { setError("Kết nối mạng không ổn định. Hãy thử kết nối lại."); }
        });
      } catch (e) {
        const message = e?.response?.data?.message || (
          e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError"
            ? "Bạn chưa cấp quyền camera hoặc microphone. Hãy cho phép quyền truy cập trong cài đặt trình duyệt rồi thử lại."
            : e?.name === "NotFoundError"
              ? "Không tìm thấy camera hoặc microphone trên thiết bị."
              : e.message || "Không tải được phiên tư vấn."
        );
        setError(message);
        setConnection("Chưa thể bắt đầu cuộc gọi");
      }
    };

    void setup();
    return () => {
      cancelled = true;
      socket?.emit("consultation:leave");
      socket?.removeAllListeners();
      socket?.disconnect();
      if (peer) {
        peer.ontrack = null;
        peer.onicecandidate = null;
        peer.onconnectionstatechange = null;
        peer.close();
      }
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [id, isDoctor, navigate, refreshDevices, closeMedia]);

  useEffect(() => {
    if (!callStartedAt) return undefined;
    const update = () => setElapsed(formatElapsed(callStartedAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [callStartedAt]);

  useEffect(() => {
    if (!remoteVideo.current || !selectedSpeaker || !canChooseSpeaker) return;
    remoteVideo.current.setSinkId(selectedSpeaker).catch(() => setDeviceError("Không thể chuyển thiết bị loa đã chọn."));
  }, [selectedSpeaker, canChooseSpeaker]);

  const toggle = (kind) => {
    const trackKind = kind === "video" ? "video" : "audio";
    const tracks = localStreamRef.current?.getTracks().filter((track) => track.kind === trackKind) || [];
    if (!tracks.length) {
      setDeviceError(kind === "video" ? "Không có camera khả dụng. Kiểm tra thiết bị rồi thử lại." : "Không có microphone khả dụng. Kiểm tra thiết bị rồi thử lại.");
      setDeviceMenuOpen(true);
      return;
    }
    const nextEnabled = !tracks[0].enabled;
    tracks.forEach((track) => { track.enabled = nextEnabled; });
    if (kind === "video") setCameraOn(nextEnabled);
    else setMicrophoneOn(nextEnabled);
  };

  const changeDevice = async (kind, deviceId) => {
    const trackKind = kind === "video" ? "video" : "audio";
    const setter = kind === "video" ? setSelectedCamera : setSelectedMicrophone;
    setter(deviceId);
    setDeviceError("");
    try {
      const replacementStream = await navigator.mediaDevices.getUserMedia({
        audio: kind === "audio" ? (deviceId ? { deviceId: { exact: deviceId } } : true) : false,
        video: kind === "video" ? (deviceId ? { deviceId: { exact: deviceId } } : true) : false,
      });
      const replacement = replacementStream.getTracks().find((track) => track.kind === trackKind);
      const oldTrack = localStreamRef.current?.getTracks().find((track) => track.kind === trackKind);
      const sender = pcRef.current?.getSenders().find((item) => item.track?.kind === trackKind);
      if (sender && replacement) await sender.replaceTrack(replacement);
      if (oldTrack) {
        localStreamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      if (replacement) localStreamRef.current?.addTrack(replacement);
      replacementStream.getTracks().filter((track) => track !== replacement).forEach((track) => track.stop());
      if (localVideo.current && localStreamRef.current) localVideo.current.srcObject = localStreamRef.current;
      if (kind === "video") setCameraOn(Boolean(replacement));
      else setMicrophoneOn(Boolean(replacement));
      await refreshDevices();
    } catch (e) {
      setDeviceError(e?.name === "NotAllowedError" ? "Trình duyệt chưa được cấp quyền sử dụng thiết bị này." : "Không thể chuyển thiết bị. Vui lòng kiểm tra quyền truy cập và thử lại.");
    }
  };

  const finish = async () => {
    if (!isDoctor || finishInProgress.current) return;
    finishInProgress.current = true;
    setIsEnding(true);
    setConfirmEnd(false);
    setConnection("Đang kết thúc buổi tư vấn");
    try {
      const response = await axiosClient.post(`/consultations/${id}/finish`);
      const finishedSession = response.data?.data;
      setSession(finishedSession);
      closeMedia();
      navigate(`/consultations/${id}/ended`, {
        replace: true,
        state: { session: finishedSession, appointment },
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Không thể cập nhật trạng thái phiên.");
      setConnection("Chưa thể kết thúc cuộc gọi");
    } finally {
      finishInProgress.current = false;
      setIsEnding(false);
    }
  };

  const leaveCall = () => {
    closeMedia();
    navigate(`/patient/appointments/${id}`, { replace: true });
  };

  const retryConnection = () => {
    setError("");
    window.location.reload();
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { setError("Trình duyệt không hỗ trợ chế độ toàn màn hình."); }
  };

  return (
    <main className={`consult-room${panelOpen ? " has-panel" : ""}`}>
      <header className="consult-topbar">
        <div className="consult-brand-lockup">
          <button className="consult-back" type="button" aria-label="Quay lại lịch hẹn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div className="consult-brand-mark"><Stethoscope size={18} /></div>
          <div className="consult-brand-copy">
            <strong>Booking Care</strong>
            <span>Phòng tư vấn trực tuyến</span>
          </div>
        </div>
        <div className="consult-call-meta">
          <span className="consult-room-id"><ShieldCheck size={15} /> Phiên {session?.id ? `#${session.id}` : "đang thiết lập"}</span>
          <span className="consult-meta-divider" />
          <span className="consult-call-timer"><Clock3 size={15} /> {elapsed}</span>
          <ConnectionPill state={connection} connected={connected} />
        </div>
        <button className={`consult-info-toggle${panelOpen ? " is-active" : ""}`} type="button" aria-label={panelOpen ? "Đóng thông tin lịch hẹn" : "Mở thông tin lịch hẹn"} onClick={() => setPanelOpen((value) => !value)}>
          {panelOpen ? <X size={18} /> : <Info size={18} />}<span>Thông tin</span>
        </button>
      </header>

      <div className="consult-workspace">
        <section className="consult-stage" aria-label="Phòng gọi tư vấn">
          <div className="consult-stage-topline">
            <div className="consult-live-label"><span className={`consult-live-dot${connected ? " is-live" : ""}`} />{connected ? "ĐANG TƯ VẤN" : "PHÒNG TƯ VẤN"}</div>
            {appointment?.specialty && appointment.specialty !== "—" && <span className="consult-specialty"><Activity size={14} />{appointment.specialty}</span>}
          </div>
          <div className="consult-video-stage">
            <video ref={remoteVideo} autoPlay playsInline className={`consult-remote-video${remoteHasVideo ? " is-visible" : ""}`} />
            {!remoteHasVideo && (
              <VideoPlaceholder
                name={peerName}
                message={connection === "Mất kết nối" ? "Đang gặp sự cố kết nối" : connection.includes("đã rời") || connection.includes("chờ") ? connection : `Đang chờ ${peerRoleLabel.toLowerCase()} tham gia phòng khám`}
              />
            )}
            <div className="consult-peer-caption">
              <span className="consult-peer-caption-avatar">{getInitials(peerName)}</span>
              <span>{peerName || peerRoleLabel}</span>
              {!connected && <span className="consult-caption-waiting"><LoaderCircle size={13} className="consult-spin" /> Đang chờ</span>}
            </div>
            <div className={`consult-local-tile${cameraOn ? " has-camera" : ""}`}>
              <video ref={localVideo} autoPlay muted playsInline className="consult-local-video" />
              {!cameraOn && <VideoPlaceholder name={myName} compact />}
              <span className="consult-local-label">Bạn · {roleLabel}</span>
              {!microphoneOn && <span className="consult-local-muted" aria-label="Microphone đang tắt"><MicOff size={14} /></span>}
            </div>
            <button className="consult-fullscreen" type="button" aria-label="Bật hoặc tắt toàn màn hình" onClick={toggleFullscreen}><Expand size={17} /></button>
            {error && (
              <div className="consult-error-banner" role="alert">
                <AlertCircle size={18} /><span>{error}</span>
                <button type="button" aria-label="Đóng thông báo lỗi" onClick={() => setError("")}><X size={16} /></button>
              </div>
            )}
            {!error && deviceError && <div className="consult-device-warning" role="status"><AlertCircle size={16} /><span>{deviceError}</span><button type="button" aria-label="Đóng thông báo thiết bị" onClick={() => setDeviceError("")}><X size={15} /></button></div>}
          </div>
          <div className="consult-stage-footer">
            <div className="consult-participant-summary"><UsersRound size={16} /><span>{myName || roleLabel}</span><span className="consult-summary-separator">·</span><span>{peerName || `Chờ ${peerRoleLabel.toLowerCase()}`}</span></div>
            <span className="consult-privacy-note"><ShieldCheck size={14} /> Cuộc gọi không được ghi hình</span>
          </div>
        </section>

        {panelOpen && <button className="consult-panel-scrim" type="button" aria-label="Đóng thông tin lịch hẹn" onClick={() => setPanelOpen(false)} />}
        <aside className={`consult-side-panel${panelOpen ? " is-open" : ""}`} aria-hidden={!panelOpen} inert={!panelOpen}>
          <div className="consult-panel-heading">
            <div><span className="consult-panel-eyebrow">CHI TIẾT</span><h2>Thông tin lịch hẹn</h2></div>
            <button type="button" aria-label="Đóng panel" onClick={() => setPanelOpen(false)}><X size={18} /></button>
          </div>
          <div className="consult-panel-content">
            <div className="consult-appointment-card">
              <span className="consult-appointment-icon"><CalendarDays size={19} /></span>
              <div><span>Thời gian hẹn</span><strong>{dateTimeLabel}</strong></div>
            </div>
            <div className="consult-people-card">
              <span className="consult-panel-eyebrow">NGƯỜI THAM GIA</span>
              <div className="consult-person-row"><span className="consult-person-avatar is-doctor"><Stethoscope size={17} /></span><div><span>Bác sĩ</span><strong>{appointment?.doctor_name || "Đang tải thông tin"}</strong></div><Check size={16} className="consult-person-check" /></div>
              <div className="consult-person-row"><span className="consult-person-avatar"><UserRound size={17} /></span><div><span>Bệnh nhân</span><strong>{appointment?.patient_name || "Đang tải thông tin"}</strong></div><Check size={16} className="consult-person-check" /></div>
            </div>
            <div className="consult-panel-status"><div className="consult-panel-status-icon"><Activity size={18} /></div><div><span>Trạng thái cuộc gọi</span><strong>{connection}</strong></div></div>
            <div className="consult-help-card"><Info size={17} /><div><strong>Gặp sự cố kết nối?</strong><p>Kiểm tra kết nối mạng và quyền camera, microphone của trình duyệt. Bạn có thể tải lại phòng để thử kết nối lại.</p>{error && <button type="button" onClick={retryConnection}><RefreshCw size={14} /> Thử kết nối lại</button>}</div></div>
            <div className="consult-device-settings">
              <div className="consult-device-title"><Settings2 size={16} /><strong>Thiết bị</strong></div>
              <label>Camera<select value={selectedCamera} onChange={(event) => changeDevice("video", event.target.value)} disabled={!devices.some((device) => device.kind === "videoinput")}><option value="">Mặc định</option>{devices.filter((device) => device.kind === "videoinput").map((device, index) => <option value={device.deviceId} key={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}</select></label>
              <label>Microphone<select value={selectedMicrophone} onChange={(event) => changeDevice("audio", event.target.value)} disabled={!devices.some((device) => device.kind === "audioinput")}><option value="">Mặc định</option>{devices.filter((device) => device.kind === "audioinput").map((device, index) => <option value={device.deviceId} key={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}</select></label>
              {canChooseSpeaker && <label>Loa<select value={selectedSpeaker} onChange={(event) => setSelectedSpeaker(event.target.value)}><option value="">Mặc định</option>{devices.filter((device) => device.kind === "audiooutput").map((device, index) => <option value={device.deviceId} key={device.deviceId}>{device.label || `Loa ${index + 1}`}</option>)}</select></label>}
              {deviceError && <p className="consult-device-error" role="status">{deviceError}</p>}
            </div>
          </div>
        </aside>
      </div>

      <footer className="consult-controls-dock">
        <div className="consult-controls-context"><span>{appointment?.booking_code || `Lịch hẹn #${id}`}</span><span>{appointment?.time || "Tư vấn 1:1"}</span></div>
        <div className="consult-controls">
          <button className={`consult-control${microphoneOn ? "" : " is-off"}`} type="button" aria-label={microphoneOn ? "Tắt microphone" : "Bật microphone"} aria-pressed={!microphoneOn} onClick={() => toggle("audio")}>
            {microphoneOn ? <Mic size={20} /> : <MicOff size={20} />}<span>{microphoneOn ? "Micro" : "Bật mic"}</span>
          </button>
          <button className={`consult-control${cameraOn ? "" : " is-off"}`} type="button" aria-label={cameraOn ? "Tắt camera" : "Bật camera"} aria-pressed={!cameraOn} onClick={() => toggle("video")}>
            {cameraOn ? <Camera size={20} /> : <CameraOff size={20} />}<span>{cameraOn ? "Camera" : "Bật cam"}</span>
          </button>
          <div className="consult-device-control-wrap">
            <button className={`consult-control consult-control-settings${deviceMenuOpen ? " is-active" : ""}`} type="button" aria-label="Mở cài đặt thiết bị" aria-expanded={deviceMenuOpen} onClick={() => setDeviceMenuOpen((value) => !value)}>
              <Settings2 size={20} /><span>Thiết bị</span><ChevronDown size={13} />
            </button>
            {deviceMenuOpen && <div className="consult-device-popover"><strong>Thiết bị đang dùng</strong><span><Video size={14} />{devices.find((device) => device.deviceId === selectedCamera)?.label || (cameraOn ? "Camera mặc định" : "Camera tắt")}</span><span><Mic size={14} />{devices.find((device) => device.deviceId === selectedMicrophone)?.label || (microphoneOn ? "Microphone mặc định" : "Microphone tắt")}</span><button type="button" onClick={() => { setPanelOpen(true); setDeviceMenuOpen(false); }}>Quản lý thiết bị</button></div>}
          </div>
          <button className={`consult-control consult-control-info${panelOpen ? " is-active" : ""}`} type="button" aria-label="Mở thông tin lịch hẹn" aria-pressed={panelOpen} onClick={() => setPanelOpen((value) => !value)}>
            <Info size={20} /><span>Thông tin</span>
          </button>
          {error && <button className="consult-control consult-control-retry" type="button" aria-label="Thử kết nối lại" onClick={retryConnection}><RefreshCw size={20} /><span>Thử lại</span></button>}
          <span className="consult-control-divider" />
          {isDoctor ? (
            <button className="consult-end-call" type="button" aria-label="Kết thúc buổi tư vấn" disabled={isEnding} onClick={() => setConfirmEnd(true)}>{isEnding ? <LoaderCircle className="consult-spin" size={21} /> : <PhoneOff size={21} />}<span>{isEnding ? "Đang kết thúc" : "Kết thúc"}</span></button>
          ) : (
            <button className="consult-end-call consult-leave-call" type="button" aria-label="Rời phòng tư vấn" onClick={leaveCall}><PhoneOff size={21} /><span>Rời phòng</span></button>
          )}
        </div>
        <div className="consult-controls-end-spacer"><span className="consult-encrypted"><ShieldCheck size={15} /> Kết nối riêng tư</span></div>
      </footer>

      {confirmEnd && <div className="consult-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isEnding) setConfirmEnd(false); }}><section className="consult-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="consult-confirm-title"><span className="consult-confirm-icon"><PhoneOff size={21} /></span><h2 id="consult-confirm-title">Kết thúc buổi tư vấn?</h2><p>Cuộc gọi sẽ kết thúc cho cả hai bên. Lịch hẹn vẫn giữ nguyên trạng thái để bạn tiếp tục xử lý hồ sơ theo quy trình.</p><div><button type="button" className="consult-confirm-cancel" disabled={isEnding} onClick={() => setConfirmEnd(false)}>Tiếp tục cuộc gọi</button><button type="button" className="consult-confirm-end" disabled={isEnding} onClick={finish}>{isEnding ? <LoaderCircle className="consult-spin" size={16} /> : <PhoneOff size={16} />} {isEnding ? "Đang kết thúc…" : "Kết thúc"}</button></div></section></div>}
      {connection.includes("Đang xác minh") && <div className="consult-loading-cover"><LoaderCircle size={28} className="consult-spin" /><strong>Đang chuẩn bị phòng tư vấn</strong><span>Đang xác minh lịch hẹn và quyền truy cập…</span></div>}
    </main>
  );
}
