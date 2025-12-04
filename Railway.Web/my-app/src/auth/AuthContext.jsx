// import { createContext, useEffect, useState } from "react";

// export const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);

//   const loadUser = () => {
//     const stored = localStorage.getItem("user");
//     if (stored) setUser(JSON.parse(stored));
//   };

//   useEffect(() => {
//     loadUser();
//     window.addEventListener("auth-updated", loadUser);
//     return () => window.removeEventListener("auth-updated", loadUser);
//   }, []);

//   const logout = () => {
//     localStorage.removeItem("authToken");
//     localStorage.removeItem("user");
//     setUser(null);
//     window.dispatchEvent(new Event("auth-updated"));
//   };

//   return (
//     <AuthContext.Provider
//       value={{ user, isAdmin: user?.role?.toLowerCase() === "admin", logout }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }
