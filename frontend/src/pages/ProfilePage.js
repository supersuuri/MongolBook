import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";

export default function ProfilePage() {
  const { user, updateUser, logout, canManagePlaces } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (!active) return;
        const me = data.data;
        updateUser(me);
        setForm({ name: me.name || "", phone: me.phone || "" });
      } catch (e) {
        if (!active) return;
        setErr(
          e.response?.data?.message || "Профайл мэдээлэл ачаалж чадсангүй",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [updateUser]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setSaving(true);

    try {
      const { data } = await api.put("/auth/profile", {
        name: form.name,
        phone: form.phone,
      });
      const updated = {
        _id: data.data._id,
        name: data.data.name,
        email: data.data.email,
        role: data.data.role,
        phone: data.data.phone,
        avatar: data.data.avatar,
      };
      updateUser(updated);
      setMsg("Профайл амжилттай хадгалагдлаа");
    } catch (e) {
      setErr(e.response?.data?.message || "Профайл хадгалах үед алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () => {
    logout();
    nav("/");
  };

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "28px 20px",
          color: "var(--muted)",
        }}
      >
        Профайл ачаалж байна...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Профайл
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          Хувийн мэдээллээ шинэчилнэ үү.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <div
            style={{
              width: 88,
              height: 88,
              margin: "0 auto 10px",
              borderRadius: "50%",
              background: "var(--blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {(user?.name || "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{user?.name}</div>
          <div
            style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}
          >
            {user?.email}
          </div>
          <span
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              background: canManagePlaces
                ? "rgba(13,148,136,0.18)"
                : "rgba(37,99,235,0.18)",
              color: canManagePlaces ? "var(--teal)" : "#60A5FA",
            }}
          >
            {canManagePlaces ? "Place Owner" : "User"}
          </span>
        </div>

        <div className="card">
          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <label>Нэр</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Таны нэр"
                required
              />
            </div>

            <div>
              <label>Имэйл</label>
              <input className="input" value={user?.email || ""} disabled />
            </div>

            <div>
              <label>Утас</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="99001122"
              />
            </div>

            <div>
              <label>Эрх</label>
              <div
                style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}
              >
                {canManagePlaces ? "Тухайн газрын админ" : "Хэрэглэгч"}
              </div>
            </div>

            {msg && (
              <div style={{ color: "var(--green)", fontSize: 13 }}>{msg}</div>
            )}
            {err && (
              <div style={{ color: "var(--red)", fontSize: 13 }}>{err}</div>
            )}

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </form>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link to="/my-bookings" className="btn btn-outline">
          Миний захиалгууд
        </Link>
        {canManagePlaces && (
          <Link to="/admin" className="btn btn-outline">
            Миний газрын удирдлага
          </Link>
        )}
        <button className="btn btn-danger" onClick={onLogout}>
          Гарах
        </button>
      </div>
    </div>
  );
}
