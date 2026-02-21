import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRBAC } from '../hooks/useRBAC';

const RoleRoute = ({ permission, children }) => {
    const { can } = useRBAC();

    if (!can(permission)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default RoleRoute;
