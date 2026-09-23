import { useEffect, useState } from "react";
import { Phone, Mail, UserRound } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../components/Layout";
import { getProfile } from "../api/users";
import { getOne, normalizeUser } from "../api/response";
import { setUser } from "../store/authSlice";

const avatarOf = (user) => user?.profilePhoto || user?.avatar || user?.avatarUrl || user?.photoUrl || user?.photo || "";
const initials = (name = "User") => name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "U";

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(user);

  useEffect(() => {
    getProfile().then((response) => {
      const fresh = normalizeUser(getOne(response, ["user", "profile"]));
      if (fresh) {
        setProfile(fresh);
        dispatch(setUser({ ...user, ...fresh }));
      }
    }).catch(() => {});
  }, []);

  const current = profile || user || {};
  const avatar = avatarOf(current);

  return <Layout>
    <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#9ee8c0]">ACCOUNT</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-.03em]">My Profile</h1>
      <p className="mt-2 text-[#91a7a1]">Your public account information and contact details.</p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-[#263746] bg-[#101d2a]">
        <div className="h-28 bg-[radial-gradient(circle_at_80%_20%,rgba(92,191,141,.22),transparent_40%),#0b1722]" />
        <div className="-mt-14 px-6 pb-7 sm:px-8">
          <div className="flex flex-wrap items-end gap-5">
            <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-[#101d2a] bg-[#123b30] text-3xl font-black text-[#9ee8c0] shadow-xl">
              {avatar ? <img src={avatar} alt={current.name || "Profile"} className="h-full w-full object-cover" /> : initials(current.name)}
            </div>
            <div className="pb-1">
              <h2 className="text-2xl font-black">{current.name || "User"}</h2>
              <p className="mt-1 text-sm text-[#71878b]">Tripora member</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#263746] bg-[#0b1722] p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#123b30] text-[#9ee8c0]"><UserRound size={18}/></span>
              <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#60777c]">Name</p>
              <p className="mt-1 font-bold">{current.name || "Not set"}</p>
            </div>
            <div className="rounded-2xl border border-[#263746] bg-[#0b1722] p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#123b30] text-[#9ee8c0]"><Mail size={18}/></span>
              <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#60777c]">Email</p>
              <p className="mt-1 truncate font-bold">{current.email || "Not set"}</p>
            </div>
            <div className="rounded-2xl border border-[#263746] bg-[#0b1722] p-5 sm:col-span-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#123b30] text-[#9ee8c0]"><Phone size={18}/></span>
              <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#60777c]">Phone number</p>
              <p className="mt-1 font-bold">{current.phone || "Not set"}</p>
              <p className="mt-2 text-xs text-[#71878b]">Phone visibility on public trip posts is controlled from Settings.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <a href="/settings" className="rounded-xl bg-[#9ee8c0] px-5 py-3 text-sm font-extrabold text-[#06251b]">Edit profile & settings</a>
          </div>
        </div>
      </div>
    </section>
  </Layout>;
}
