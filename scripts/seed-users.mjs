import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "digiport-ptpp",
  appId: "1:915090878008:web:594a85e463f0fa17ea40cd",
  storageBucket: "digiport-ptpp.firebasestorage.app",
  apiKey: "AIzaSyAYSHs1QSt0Q1SjI3pIrUc0yFnIBxxOxX4",
  authDomain: "digiport-ptpp.firebaseapp.com",
  messagingSenderId: "915090878008"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usersToCreate = [
  {
    email: "urip@pertamina.com",
    password: "password123",
    name: "Urip Widodo",
    role: "spv_rsd",
    jobTitle: "Supervisor RSD"
  },
  {
    email: "kiamnasmeithson@pertamina.com",
    password: "password123",
    name: "Kiamnasmeithson",
    role: "spv_maintenance",
    jobTitle: "Spv Maintenance"
  },
  {
    email: "wahyudi@pertamina.com",
    password: "password123",
    name: "Wahyudi",
    role: "aftm",
    jobTitle: "AFTM DEO"
  }
];

async function createUsers() {
  for (const user of usersToCreate) {
    try {
      console.log(`\nCreating user: ${user.email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      
      console.log(`Setting profile name for ${user.email}`);
      await updateProfile(userCredential.user, { displayName: user.name });

      console.log(`Adding ${user.email} to Firestore users collection`);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        jobTitle: user.jobTitle,
        status: "approved",
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Successfully created ${user.name} (${user.role})`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${user.email} already exists! Skipping...`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, error);
      }
    }
  }
  process.exit(0);
}

createUsers();
