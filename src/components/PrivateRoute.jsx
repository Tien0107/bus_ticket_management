import { Navigate, useLocation } from "react-router-dom";
import { clearStoredUser, getStoredToken } from "../utils/authStorage";

function PrivateRoute({ children }) {
  const location = useLocation();
  const token = getStoredToken();

  if (!token) {
    clearStoredUser();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default PrivateRoute;
