import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { PinIcon } from "../components/UiIcons";

export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setL] = useState(false);
  const { login, isAdmin } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setL(true);
    try {
      const u = await login(form.email, form.password);
      nav(u.role === "admin" ? "/admin" : "/");
    } catch (e) {
      setErr(e.response?.data?.message || "Алдаа гарлаа");
    }
    setL(false);
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              color: "var(--blue)",
              marginBottom: 8,
            }}
          >
            <PinIcon size={36} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Нэвтрэх</h1>
          <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
            Захиалга платформд тавтай морил
          </p>
        </div>

        <div className="card">
          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label>Имэйл</label>
              <input
                type="email"
                className="input"
                placeholder="example@gmail.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Нууц үг</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            {err && (
              <div style={{ color: "var(--red)", fontSize: 13 }}>{err}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: "12px 0", fontSize: 15, marginTop: 4 }}
            >
              {loading ? "Нэвтэрж байна..." : "Нэвтрэх"}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 16,
              fontSize: 13,
              color: "var(--muted)",
            }}
          >
            Бүртгэлгүй юу?{" "}
            <Link to="/register" style={{ color: "var(--blue)" }}>
              Бүртгүүлэх
            </Link>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "var(--surface)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <div
              style={{ fontWeight: 600, marginBottom: 6, color: "var(--text)" }}
            >
              Туршилтын бүртгэл:
            </div>
            <div>Admin: admin@zahialga.mn / admin123</div>
            <div>User: batsuurii@gmail.com / password123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [err, setErr] = useState("");
  const [loading, setL] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setL(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.message || "Алдаа гарлаа");
    }
    setL(false);
  };

  const f = (k) => ({
    value: form[k],
    onChange: (e) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              color: "var(--blue)",
              marginBottom: 8,
            }}
          >
            <PinIcon size={36} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Бүртгүүлэх</h1>
          <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
            Шинэ бүртгэл үүсгэх
          </p>
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
                placeholder="Таны нэр"
                {...f("name")}
                required
              />
            </div>
            <div>
              <label>Имэйл</label>
              <input
                type="email"
                className="input"
                placeholder="example@gmail.com"
                {...f("email")}
                required
              />
            </div>
            <div>
              <label>Нууц үг</label>
              <input
                type="password"
                className="input"
                placeholder="Дор хаяж 6 тэмдэгт"
                {...f("password")}
                required
                minLength={6}
              />
            </div>
            <div>
              <label>Утасны дугаар</label>
              <input className="input" placeholder="99001122" {...f("phone")} />
            </div>
            {err && (
              <div style={{ color: "var(--red)", fontSize: 13 }}>{err}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: "12px 0", fontSize: 15, marginTop: 4 }}
            >
              {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
            </button>
          </form>
          <div
            style={{
              textAlign: "center",
              marginTop: 16,
              fontSize: 13,
              color: "var(--muted)",
            }}
          >
            Бүртгэлтэй юу?{" "}
            <Link to="/login" style={{ color: "var(--blue)" }}>
              Нэвтрэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
