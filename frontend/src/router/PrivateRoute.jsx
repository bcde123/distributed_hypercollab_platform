import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { checkAuth } from "@/features/auth/authThunks";

export default function PrivateRoute({ children }) {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isLoading = useSelector((state) => state.auth.isLoading);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const verify = async () => {
      await dispatch(checkAuth());
      setChecked(true);
    };
    verify();
  }, [dispatch]);

  if (!checked || isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
