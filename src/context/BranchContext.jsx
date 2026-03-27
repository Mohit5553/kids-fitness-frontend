import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUser } from '../utils/auth';

const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('selectedBranch') || '');
  const [availableBranches, setAvailableBranches] = useState([]);
  const user = getUser();

  useEffect(() => {
    if (user) {
      // If superadmin, availableBranches will be set by the component that fetches all locations
      // For others, it's their assigned locationIds
      if (user.role !== 'superadmin') {
        setAvailableBranches(user.locationIds || []);
        if (!selectedBranch && user.locationIds?.length > 0) {
          const firstBranch = typeof user.locationIds[0] === 'string' ? user.locationIds[0] : user.locationIds[0]._id;
          setSelectedBranch(firstBranch);
          localStorage.setItem('selectedBranch', firstBranch);
        }
      }
    }
  }, [user, selectedBranch]);

  const selectBranch = (branchId) => {
    setSelectedBranch(branchId);
    localStorage.setItem('selectedBranch', branchId);
  };

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch: selectBranch, availableBranches, setAvailableBranches }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
