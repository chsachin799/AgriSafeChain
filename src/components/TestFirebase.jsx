// src/components/TestFirebase.jsx
import React, { useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const TestFirebase = () => {
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      querySnapshot.forEach((doc) => {
        console.log(`${doc.id} =>`, doc.data());
      });
    };
    fetchData();
  }, []);

  return <div>Firebase Connected ✅</div>;
};

export default TestFirebase;
