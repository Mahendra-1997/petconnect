import "./firebase";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { auth, db, storage } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Nepal",
  "India",
  "Germany",
  "France",
  "Japan",
  "Brazil",
];

const INITIAL_DOCTORS = [
  {
    id: 1,
    name: "Dr. Sofia Carter",
    specialty: "General Vet",
    clinic: "PetCare Central",
    city: "Dallas",
    country: "United States",
    nextAvailable: "Tomorrow 10:00 AM",
    verified: true,
  },
  {
    id: 2,
    name: "Dr. Rohan Thapa",
    specialty: "Vaccination & Wellness",
    clinic: "Healthy Paws Clinic",
    city: "Fort Worth",
    country: "United States",
    nextAvailable: "Today 4:30 PM",
    verified: true,
  },
];

const INITIAL_SHOPS = [
  {
    id: 1,
    businessName: "Happy Bowl Pet Shop",
    category: "Food",
    title: "Premium grain-free dog food",
    price: "$29.99",
    location: "Dallas, Texas, United States",
    description: "High-protein dog food for active pets.",
    verified: true,
    website: "https://example.com",
  },
];

const INITIAL_ADOPTIONS = [
  {
    id: 1,
    petName: "Bella",
    type: "Dog",
    location: "Dallas, United States",
    note: "Friendly, playful, vaccinated.",
  },
  {
    id: 2,
    petName: "Milo",
    type: "Cat",
    location: "Toronto, Canada",
    note: "Calm, affectionate, indoor pet.",
  },
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    with: "Verified Seller - Alex",
    lastMessage: "Is the pet still available?",
    messages: [
      { id: 1, sender: "Alex", text: "Hello, I saw your listing." },
      { id: 2, sender: "You", text: "Yes, it is still available." },
      { id: 3, sender: "Alex", text: "Is the pet still available?" },
    ],
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    text: "Welcome to PetConnect. Complete verification for more trust.",
    type: "info",
  },
];

function Card({ children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #d1d5db",
        borderRadius: 14,
        padding: 16,
        marginTop: 14,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </div>
  );
}

function Title({ title, subtitle }) {
  return (
    <div style={{ textAlign: "left", marginBottom: 10 }}>
      <h2 style={{ marginBottom: 6 }}>{title}</h2>
      {subtitle ? (
        <p style={{ margin: 0, color: "#4b5563" }}>{subtitle}</p>
      ) : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12, textAlign: "left" }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function inputStyle(extra = {}) {
  return {
    width: "100%",
    padding: 10,
    border: "1px solid #9ca3af",
    borderRadius: 8,
    boxSizing: "border-box",
    ...extra,
  };
}

function buttonPrimary(extra = {}) {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    marginRight: 8,
    marginTop: 6,
    ...extra,
  };
}

function buttonSecondary(extra = {}) {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#111827",
    cursor: "pointer",
    marginRight: 8,
    marginTop: 6,
    ...extra,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState("feed");
  const [marketSubTab, setMarketSubTab] = useState("pets");
  const [serviceSubTab, setServiceSubTab] = useState("overview");

  const [user, setUser] = useState(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    country: "United States",
    address: "",
    governmentId: "",
  });

  const [profile, setProfile] = useState({
    fullName: "Mahendra",
    email: "",
    phone: "",
    country: "United States",
    address: "",
    governmentId: "",
    bio: "Building a trusted worldwide pet platform.",
    role: "User",
    accountStatus: "Pending",
    verifiedEmail: false,
    verifiedId: false,
    verifiedSeller: false,
    verifiedDoctor: false,
    verifiedBusiness: false,
  });

  const [posts, setPosts] = useState([]);
  const [postForm, setPostForm] = useState({
    petName: "",
    caption: "",
    mediaUrl: "",
    location: "",
    hashtags: "",
    isFunnyMoment: false,
  });

  const [selectedPostFile, setSelectedPostFile] = useState(null);
  const [isUploadingPost, setIsUploadingPost] = useState(false);

  const [petProfiles, setPetProfiles] = useState([]);
  const [petForm, setPetForm] = useState({
    name: "",
    breed: "",
    age: "",
    gender: "",
    color: "",
    weight: "",
    birthday: "",
    temperament: "",
    microchip: "",
    vaccinated: "No",
  });

  const [listings, setListings] = useState([]);
  const [listingForm, setListingForm] = useState({
    sellerName: "",
    petName: "",
    breed: "",
    age: "",
    gender: "",
    category: "Dog",
    price: "",
    currency: "USD",
    location: "",
    vaccinated: "Yes",
    description: "",
  });

  const [shops, setShops] = useState(INITIAL_SHOPS);
  const [shopForm, setShopForm] = useState({
    businessName: "",
    category: "Food",
    title: "",
    price: "",
    location: "",
    description: "",
    website: "",
  });

  const [adoptions, setAdoptions] = useState(INITIAL_ADOPTIONS);
  const [adoptionForm, setAdoptionForm] = useState({
    petName: "",
    type: "Dog",
    location: "",
    note: "",
  });

  const [doctors, setDoctors] = useState(INITIAL_DOCTORS);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    specialty: "",
    clinic: "",
    city: "",
    country: "United States",
    licenseId: "",
    nextAvailable: "",
  });

  const [appointments, setAppointments] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState({
    petName: "",
    doctorName: "",
    appointmentDate: "",
    reason: "",
    clinicAddress: "",
  });

  const [vaccines, setVaccines] = useState([]);
  const [vaccineForm, setVaccineForm] = useState({
    petName: "",
    vaccineName: "",
    completedDate: "",
    nextDueDate: "",
    clinicName: "",
    clinicAddress: "",
  });

  const [lostFoundPosts, setLostFoundPosts] = useState([]);
  const [lostFoundForm, setLostFoundForm] = useState({
    petName: "",
    status: "Lost",
    lastSeen: "",
    details: "",
  });

  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    targetName: "",
    role: "Seller",
    rating: "5",
    review: "",
  });

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [selectedChatId, setSelectedChatId] = useState(1);
  const [messageInput, setMessageInput] = useState("");

  const [capturedImage, setCapturedImage] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const selectedChat = useMemo(() => {
    return messages.find((chat) => chat.id === selectedChatId) || messages[0];
  }, [messages, selectedChatId]);

  const addNotification = (text, type = "info") => {
    setNotifications((prev) => [{ id: Date.now(), text, type }, ...prev]);
  };

  const mapLink = (address) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address || ""
    )}`;

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();

            setUser({
              name: userData.fullName,
              email: userData.email,
              uid: firebaseUser.uid,
            });
            await setDoc(
              doc(db, "users", firebaseUser.uid),
              {
                accountStatus: "Active",
                verifiedEmail: true,
              },
              { merge: true }
            );

            setProfile({
              fullName: userData.fullName,
              email: userData.email,
              phone: userData.phone || "",
              country: userData.country || "United States",
              address: userData.address || "",
              governmentId: userData.governmentId || "",
              bio: userData.bio || "",
              role: userData.role || "User",
              accountStatus: "Active",
              verifiedEmail: true,
              verifiedId: userData.verifiedId || false,
              verifiedSeller: userData.verifiedSeller || false,
              verifiedDoctor: userData.verifiedDoctor || false,
              verifiedBusiness: userData.verifiedBusiness || false,
            });
          }
        } catch (error) {
          alert(error.message);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignup = async () => {
    const { fullName, email, password, phone, country, address, governmentId } =
      signupForm;

    if (
      !fullName ||
      !email ||
      !password ||
      !phone ||
      !country ||
      !address ||
      !governmentId
    ) {
      alert("Please complete all fields.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      await sendEmailVerification(firebaseUser);

      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        fullName,
        email,
        phone,
        country,
        address,
        governmentId,
        bio: "Excited to connect with pet lovers worldwide.",
        createdAt: new Date().toISOString(),
        accountStatus: "Pending",
        verifiedEmail: false,
        verifiedId: false,
        verifiedSeller: false,
        verifiedDoctor: false,
        verifiedBusiness: false,
        role: "User",
      });

      alert("Account created! Please verify your email before logging in.");

      setSignupForm({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        country: "United States",
        address: "",
        governmentId: "",
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert("Enter email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );

      const firebaseUser = userCredential.user;

      if (!firebaseUser.emailVerified) {
        alert("Please verify your email before logging in.");
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        setUser({
          name: userData.fullName,
          email: userData.email,
          uid: firebaseUser.uid,
        });

        setProfile({
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone || "",
          country: userData.country || "United States",
          address: userData.address || "",
          governmentId: userData.governmentId || "",
          bio: userData.bio || "",
          role: userData.role || "User",
          verifiedEmail: true,
          verifiedId: userData.verifiedId || false,
          verifiedSeller: userData.verifiedSeller || false,
          verifiedDoctor: userData.verifiedDoctor || false,
          verifiedBusiness: userData.verifiedBusiness || false,
        });
      }

      addNotification("Logged in successfully.", "success");
    } catch (error) {
      alert(error.message);
    }
  };

  const logout = async () => {
    try {
      stopCamera();
      await signOut(auth);
      setUser(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const updateProfile = () => {
    addNotification("Profile updated successfully.", "success");
  };
  const uploadPostImage = async () => {
    if (!selectedPostFile) return "";

    try {
      setIsUploadingPost(true);

      const fileRef = ref(
        storage,
        `post-images/${Date.now()}-${selectedPostFile.name}`
      );

      await uploadBytes(fileRef, selectedPostFile);
      const downloadURL = await getDownloadURL(fileRef);

      setIsUploadingPost(false);
      return downloadURL;
    } catch (error) {
      setIsUploadingPost(false);
      alert(error.message);
      return "";
    }
  };

  const addPost = async () => {
    if (!postForm.petName || !postForm.caption) {
      alert("Please add pet name and caption.");
      return;
    }

    let uploadedImageUrl = postForm.mediaUrl;

    if (selectedPostFile) {
      uploadedImageUrl = await uploadPostImage();
      if (!uploadedImageUrl) return;
    }

    const newPost = {
      id: Date.now(),
      author: profile.fullName || user?.name || "User",
      ...postForm,
      mediaUrl: uploadedImageUrl,
    };

    setPosts((prev) => [newPost, ...prev]);

    setPostForm({
      petName: "",
      caption: "",
      mediaUrl: "",
      location: "",
      hashtags: "",
      isFunnyMoment: false,
    });

    setSelectedPostFile(null);
    addNotification("New social post published.", "social");
  };

  const addPetProfile = () => {
    if (!petForm.name || !petForm.breed) {
      alert("Please add pet name and breed.");
      return;
    }

    setPetProfiles((prev) => [{ id: Date.now(), ...petForm }, ...prev]);
    setPetForm({
      name: "",
      breed: "",
      age: "",
      gender: "",
      color: "",
      weight: "",
      birthday: "",
      temperament: "",
      microchip: "",
      vaccinated: "No",
    });
    addNotification("Pet profile created successfully.", "pet");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      addNotification("Camera started for live pet verification.", "security");
    } catch (error) {
      alert("Please allow camera access.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) {
      alert("Camera is not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/png");
    setCapturedImage(image);
    addNotification("Live pet image captured.", "security");
  };

  const addListing = () => {
    if (
      !listingForm.sellerName ||
      !listingForm.petName ||
      !listingForm.price ||
      !listingForm.location ||
      !listingForm.description ||
      !capturedImage
    ) {
      alert("Complete all listing fields and capture a live pet photo.");
      return;
    }

    setListings((prev) => [
      {
        id: Date.now(),
        ...listingForm,
        capturedImage,
        verifiedSeller: profile.verifiedEmail && profile.verifiedId,
      },
      ...prev,
    ]);

    setProfile((prev) => ({ ...prev, verifiedSeller: true }));
    setListingForm({
      sellerName: "",
      petName: "",
      breed: "",
      age: "",
      gender: "",
      category: "Dog",
      price: "",
      currency: "USD",
      location: "",
      vaccinated: "Yes",
      description: "",
    });
    setCapturedImage("");
    stopCamera();
    addNotification("Verified pet listing published.", "marketplace");
  };

  const addShop = () => {
    if (!shopForm.businessName || !shopForm.title || !shopForm.location) {
      alert("Please complete business ad fields.");
      return;
    }

    setShops((prev) => [
      {
        id: Date.now(),
        ...shopForm,
        verified: profile.verifiedEmail && profile.verifiedId,
      },
      ...prev,
    ]);

    setProfile((prev) => ({ ...prev, verifiedBusiness: true }));
    setShopForm({
      businessName: "",
      category: "Food",
      title: "",
      price: "",
      location: "",
      description: "",
      website: "",
    });
    addNotification("Pet shop ad published.", "business");
  };

  const addAdoption = () => {
    if (!adoptionForm.petName || !adoptionForm.location) {
      alert("Complete adoption details.");
      return;
    }

    setAdoptions((prev) => [{ id: Date.now(), ...adoptionForm }, ...prev]);
    setAdoptionForm({
      petName: "",
      type: "Dog",
      location: "",
      note: "",
    });
    addNotification("Adoption listing added.", "adoption");
  };

  const addDoctor = () => {
    if (
      !doctorForm.name ||
      !doctorForm.specialty ||
      !doctorForm.clinic ||
      !doctorForm.licenseId
    ) {
      alert("Complete doctor profile details.");
      return;
    }

    setDoctors((prev) => [
      { id: Date.now(), ...doctorForm, verified: true },
      ...prev,
    ]);

    setProfile((prev) => ({
      ...prev,
      verifiedDoctor: true,
      role: "Doctor / User",
    }));

    setDoctorForm({
      name: "",
      specialty: "",
      clinic: "",
      city: "",
      country: "United States",
      licenseId: "",
      nextAvailable: "",
    });

    addNotification("Doctor profile created.", "service");
  };

  const addAppointment = () => {
    if (
      !appointmentForm.petName ||
      !appointmentForm.doctorName ||
      !appointmentForm.appointmentDate
    ) {
      alert("Complete appointment details.");
      return;
    }

    setAppointments((prev) => [
      { id: Date.now(), ...appointmentForm },
      ...prev,
    ]);

    setAppointmentForm({
      petName: "",
      doctorName: "",
      appointmentDate: "",
      reason: "",
      clinicAddress: "",
    });

    addNotification("Doctor appointment booked.", "health");
  };

  const addVaccine = () => {
    if (
      !vaccineForm.petName ||
      !vaccineForm.vaccineName ||
      !vaccineForm.nextDueDate
    ) {
      alert("Complete vaccine record details.");
      return;
    }

    setVaccines((prev) => [{ id: Date.now(), ...vaccineForm }, ...prev]);
    setVaccineForm({
      petName: "",
      vaccineName: "",
      completedDate: "",
      nextDueDate: "",
      clinicName: "",
      clinicAddress: "",
    });

    addNotification("Vaccine record saved.", "health");
  };

  const addLostFound = () => {
    if (!lostFoundForm.petName || !lostFoundForm.lastSeen) {
      alert("Complete lost/found details.");
      return;
    }

    setLostFoundPosts((prev) => [
      { id: Date.now(), ...lostFoundForm },
      ...prev,
    ]);

    setLostFoundForm({
      petName: "",
      status: "Lost",
      lastSeen: "",
      details: "",
    });

    addNotification("Lost & Found alert created.", "alert");
  };

  const addReview = () => {
    if (!reviewForm.targetName || !reviewForm.review) {
      alert("Complete review details.");
      return;
    }

    setReviews((prev) => [
      {
        id: Date.now(),
        author: profile.fullName || user?.name || "User",
        ...reviewForm,
      },
      ...prev,
    ]);

    setReviewForm({
      targetName: "",
      role: "Seller",
      rating: "5",
      review: "",
    });

    addNotification("Review submitted.", "review");
  };

  const sendMessage = () => {
    if (!selectedChat || !messageInput.trim()) return;

    setMessages((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              lastMessage: messageInput,
              messages: [
                ...chat.messages,
                { id: Date.now(), sender: "You", text: messageInput },
              ],
            }
          : chat
      )
    );

    setMessageInput("");
    addNotification(`Message sent to ${selectedChat.with}.`, "chat");
  };

  const stats = {
    posts: posts.length,
    pets: petProfiles.length,
    listings: listings.length,
    shops: shops.length,
    doctors: doctors.length,
    vaccines: vaccines.length,
    appointments: appointments.length,
    adoptions: adoptions.length,
    reviews: reviews.length,
  };

  const renderAuth = () => {
    return (
      <div style={{ maxWidth: 1050, margin: "30px auto", padding: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ marginBottom: 6 }}>🐾 PetConnect</h1>
          <p style={{ margin: 0 }}>
            Worldwide trusted pet social, marketplace, business, and care
            platform
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          <Card>
            <Title title="Login" subtitle="Access your account securely" />

            <Field label="Email">
              <input
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                style={inputStyle()}
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                style={inputStyle()}
              />
            </Field>

            <button onClick={handleLogin} style={buttonPrimary()}>
              Login
            </button>
          </Card>

          <Card>
            <Title
              title="Create Account"
              subtitle="Real email verification + government-issued ID for trust"
            />

            <Field label="Full Name">
              <input
                value={signupForm.fullName}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                placeholder="Full name"
                style={inputStyle()}
              />
            </Field>

            <Field label="Email">
              <input
                value={signupForm.email}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Email"
                style={inputStyle()}
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={signupForm.password}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="Password"
                style={inputStyle()}
              />
            </Field>

            <Field label="Phone">
              <input
                value={signupForm.phone}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Phone"
                style={inputStyle()}
              />
            </Field>

            <Field label="Country">
              <select
                value={signupForm.country}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    country: e.target.value,
                  }))
                }
                style={inputStyle()}
              >
                {COUNTRIES.map((country) => (
                  <option key={country}>{country}</option>
                ))}
              </select>
            </Field>

            <Field label="Full Address">
              <input
                value={signupForm.address}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Full address"
                style={inputStyle()}
              />
            </Field>

            <Field label="Government-Issued ID Number">
              <input
                value={signupForm.governmentId}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    governmentId: e.target.value,
                  }))
                }
                placeholder="Passport / Driver License / National ID"
                style={inputStyle()}
              />
            </Field>

            <button onClick={handleSignup} style={buttonPrimary()}>
              Create Account
            </button>
          </Card>
        </div>
      </div>
    );
  };

  const renderFeed = () => (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Title
        title="Community Feed"
        subtitle="Share funny moments, emotional stories, and pet memories worldwide"
      />

      <Card>
        <Field label="Pet Name">
          <input
            value={postForm.petName}
            onChange={(e) =>
              setPostForm((prev) => ({ ...prev, petName: e.target.value }))
            }
            placeholder="Pet name"
            style={inputStyle()}
          />
        </Field>

        <Field label="Caption">
          <textarea
            value={postForm.caption}
            onChange={(e) =>
              setPostForm((prev) => ({ ...prev, caption: e.target.value }))
            }
            placeholder="Share your pet moment"
            style={inputStyle({ minHeight: 90 })}
          />
        </Field>

        <Field label="Media URL (optional)">
          <input
            value={postForm.mediaUrl}
            onChange={(e) =>
              setPostForm((prev) => ({ ...prev, mediaUrl: e.target.value }))
            }
            placeholder="Image or video URL"
            style={inputStyle()}
          />
        </Field>

        <Field label="Upload Pet Photo">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedPostFile(e.target.files[0])}
            style={inputStyle()}
          />
        </Field>

        {selectedPostFile && (
          <Card>
            <p>
              <strong>Selected File:</strong> {selectedPostFile.name}
            </p>
            <button
              onClick={() => setSelectedPostFile(null)}
              style={buttonSecondary()}
              type="button"
            >
              Remove Selected Photo
            </button>
          </Card>
        )}

        <Field label="Location">
          <input
            value={postForm.location}
            onChange={(e) =>
              setPostForm((prev) => ({ ...prev, location: e.target.value }))
            }
            placeholder="City, country, or full address"
            style={inputStyle()}
          />
        </Field>

        <Field label="Hashtags">
          <input
            value={postForm.hashtags}
            onChange={(e) =>
              setPostForm((prev) => ({ ...prev, hashtags: e.target.value }))
            }
            placeholder="#funny #dog #cat"
            style={inputStyle()}
          />
        </Field>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={postForm.isFunnyMoment}
            onChange={(e) =>
              setPostForm((prev) => ({
                ...prev,
                isFunnyMoment: e.target.checked,
              }))
            }
          />
          Mark as funny pet moment
        </label>

        <button
          onClick={addPost}
          style={buttonPrimary()}
          disabled={isUploadingPost}
        >
          {isUploadingPost ? "Uploading..." : "Publish Post"}
        </button>
      </Card>

      {posts.length === 0 ? (
        <Card>
          <p>No posts yet. Start the first worldwide pet story.</p>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 6 }}>
                  {post.petName}
                </h3>
                <p style={{ margin: 0 }}>By {post.author}</p>
              </div>

              {post.isFunnyMoment ? (
                <div
                  style={{
                    background: "#fef3c7",
                    padding: "6px 10px",
                    borderRadius: 999,
                  }}
                >
                  Funny Moment
                </div>
              ) : null}
            </div>

            <button
              onClick={() =>
                setPosts((prev) => prev.filter((item) => item.id !== post.id))
              }
              style={buttonSecondary()}
            >
              Delete Post
            </button>

            <p>{post.caption}</p>

            {post.mediaUrl ? (
              <img
                src={post.mediaUrl}
                alt={post.petName}
                style={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            ) : null}

            {post.location ? (
              <p>
                <strong>Location:</strong> {post.location}{" "}
                <a
                  href={mapLink(post.location)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
              </p>
            ) : null}

            {post.hashtags ? (
              <p style={{ color: "#4b5563" }}>{post.hashtags}</p>
            ) : null}
          </Card>
        ))
      )}
    </div>
  );

  const renderPetProfiles = () => (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Title
        title="Pet Profiles"
        subtitle="Create full care and identity records for every pet"
      />

      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <Field label="Name">
            <input
              value={petForm.name}
              onChange={(e) =>
                setPetForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Pet name"
              style={inputStyle()}
            />
          </Field>

          <Field label="Breed">
            <input
              value={petForm.breed}
              onChange={(e) =>
                setPetForm((prev) => ({ ...prev, breed: e.target.value }))
              }
              placeholder="Breed"
              style={inputStyle()}
            />
          </Field>

          <Field label="Age">
            <input
              value={petForm.age}
              onChange={(e) =>
                setPetForm((prev) => ({ ...prev, age: e.target.value }))
              }
              placeholder="Age"
              style={inputStyle()}
            />
          </Field>

          <Field label="Gender">
            <input
              value={petForm.gender}
              onChange={(e) =>
                setPetForm((prev) => ({ ...prev, gender: e.target.value }))
              }
              placeholder="Gender"
              style={inputStyle()}
            />
          </Field>

          <Field label="Color">
            <input
              value={petForm.color}
              onChange={(e) =>
                setPetForm((prev) => ({ ...prev, color: e.target.value }))
              }
              placeholder="Color"
              style={inputStyle()}
            />
          </Field>

          <Field label="Weight">
            <input
              value={petForm.weight}
              onChange={(e) =>
                setPetForm((prev) => ({ ...prev, weight: e.target.value }))
              }
              placeholder="Weight"
              style={inputStyle()}
            />
          </Field>

          <Field label="Birthday">
            <input
              value={petForm.birthday}
              onChange={(e) =>
                setPetForm((prev) => ({ ...prev, birthday: e.target.value }))
              }
              placeholder="Birthday"
              style={inputStyle()}
            />
          </Field>

          <Field label="Temperament">
            <input
              value={petForm.temperament}
              onChange={(e) =>
                setPetForm((prev) => ({
                  ...prev,
                  temperament: e.target.value,
                }))
              }
              placeholder="Friendly / Active / Calm"
              style={inputStyle()}
            />
          </Field>

          <Field label="Microchip Number">
            <input
              value={petForm.microchip}
              onChange={(e) =>
                setPetForm((prev) => ({ ...prev, microchip: e.target.value }))
              }
              placeholder="Microchip number"
              style={inputStyle()}
            />
          </Field>

          <Field label="Vaccinated">
            <select
              value={petForm.vaccinated}
              onChange={(e) =>
                setPetForm((prev) => ({ ...prev, vaccinated: e.target.value }))
              }
              style={inputStyle()}
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </Field>
        </div>

        <button onClick={addPetProfile} style={buttonPrimary()}>
          Create Pet Profile
        </button>
      </Card>

      {petProfiles.map((pet) => (
        <Card key={pet.id}>
          <h3 style={{ marginTop: 0 }}>{pet.name}</h3>
          <p>
            <strong>Breed:</strong> {pet.breed}
          </p>
          <p>
            <strong>Age:</strong> {pet.age}
          </p>
          <p>
            <strong>Gender:</strong> {pet.gender}
          </p>
          <p>
            <strong>Color:</strong> {pet.color}
          </p>
          <p>
            <strong>Weight:</strong> {pet.weight}
          </p>
          <p>
            <strong>Birthday:</strong> {pet.birthday}
          </p>
          <p>
            <strong>Temperament:</strong> {pet.temperament}
          </p>
          <p>
            <strong>Microchip:</strong> {pet.microchip}
          </p>
          <p>
            <strong>Vaccinated:</strong> {pet.vaccinated}
          </p>
        </Card>
      ))}
    </div>
  );

  const renderMarketplace = () => (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Title
        title="Marketplace"
        subtitle="Verified pet listings plus business advertising for pet shops worldwide"
      />

      <div style={{ marginBottom: 10 }}>
        <button
          onClick={() => setMarketSubTab("pets")}
          style={buttonSecondary()}
        >
          Pet Listings
        </button>
        <button
          onClick={() => setMarketSubTab("shops")}
          style={buttonSecondary()}
        >
          Pet Shops
        </button>
        <button
          onClick={() => setMarketSubTab("reviews")}
          style={buttonSecondary()}
        >
          Reviews
        </button>
      </div>

      {marketSubTab === "pets" && (
        <>
          <Card>
            <Title
              title="Sell a Pet"
              subtitle="Live camera capture is required to help reduce scams"
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <Field label="Seller Name">
                <input
                  value={listingForm.sellerName}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      sellerName: e.target.value,
                    }))
                  }
                  placeholder="Seller name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Pet Name">
                <input
                  value={listingForm.petName}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      petName: e.target.value,
                    }))
                  }
                  placeholder="Pet name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Breed">
                <input
                  value={listingForm.breed}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      breed: e.target.value,
                    }))
                  }
                  placeholder="Breed"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Age">
                <input
                  value={listingForm.age}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      age: e.target.value,
                    }))
                  }
                  placeholder="Age"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Gender">
                <input
                  value={listingForm.gender}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      gender: e.target.value,
                    }))
                  }
                  placeholder="Gender"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Category">
                <select
                  value={listingForm.category}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  style={inputStyle()}
                >
                  <option>Dog</option>
                  <option>Cat</option>
                  <option>Bird</option>
                  <option>Rabbit</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Price">
                <input
                  value={listingForm.price}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="Price"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Currency">
                <input
                  value={listingForm.currency}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                  placeholder="USD"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Full Address / Location">
                <input
                  value={listingForm.location}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Full address"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Vaccinated">
                <select
                  value={listingForm.vaccinated}
                  onChange={(e) =>
                    setListingForm((prev) => ({
                      ...prev,
                      vaccinated: e.target.value,
                    }))
                  }
                  style={inputStyle()}
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={listingForm.description}
                onChange={(e) =>
                  setListingForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Health, behavior, temperament, care information"
                style={inputStyle({ minHeight: 90 })}
              />
            </Field>

            <Card>
              <h3 style={{ marginTop: 0 }}>Live Camera Verification</h3>

              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  maxWidth: 420,
                  background: "#000",
                  borderRadius: 8,
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              <div style={{ marginTop: 10 }}>
                <button onClick={startCamera} style={buttonPrimary()}>
                  Start Camera
                </button>
                <button onClick={capturePhoto} style={buttonSecondary()}>
                  Capture Live Pet Photo
                </button>
                <button onClick={stopCamera} style={buttonSecondary()}>
                  Stop Camera
                </button>
              </div>

              {capturedImage ? (
                <div style={{ marginTop: 10 }}>
                  <strong>Captured Image</strong>
                  <div>
                    <img
                      src={capturedImage}
                      alt="Captured pet"
                      style={{
                        width: "100%",
                        maxWidth: 300,
                        borderRadius: 8,
                        marginTop: 8,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </Card>

            <button onClick={addListing} style={buttonPrimary()}>
              Publish Verified Listing
            </button>
          </Card>

          {listings.map((item) => (
            <Card key={item.id}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 16,
                }}
              >
                <div>
                  <h3 style={{ marginTop: 0 }}>{item.petName}</h3>
                  <p>
                    <strong>Seller:</strong> {item.sellerName}
                  </p>
                  <p>
                    <strong>Breed:</strong> {item.breed}
                  </p>
                  <p>
                    <strong>Age:</strong> {item.age}
                  </p>
                  <p>
                    <strong>Gender:</strong> {item.gender}
                  </p>
                  <p>
                    <strong>Category:</strong> {item.category}
                  </p>
                  <p>
                    <strong>Price:</strong> {item.currency} {item.price}
                  </p>
                  <p>
                    <strong>Vaccinated:</strong> {item.vaccinated}
                  </p>
                  <p>
                    <strong>Location:</strong> {item.location}
                  </p>
                  <p>
                    <a
                      href={mapLink(item.location)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open address in Google Maps
                    </a>
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {item.verifiedSeller
                      ? "Verified Seller"
                      : "Pending verification"}
                  </p>
                  <p>{item.description}</p>
                </div>

                <div>
                  <img
                    src={item.capturedImage}
                    alt={item.petName}
                    style={{ width: "100%", borderRadius: 12 }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {marketSubTab === "shops" && (
        <>
          <Card>
            <Title
              title="Pet Shop / Business Advertising"
              subtitle="Pet shops can advertise food, accessories, medicine, and more"
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <Field label="Business Name">
                <input
                  value={shopForm.businessName}
                  onChange={(e) =>
                    setShopForm((prev) => ({
                      ...prev,
                      businessName: e.target.value,
                    }))
                  }
                  placeholder="Business name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Category">
                <select
                  value={shopForm.category}
                  onChange={(e) =>
                    setShopForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  style={inputStyle()}
                >
                  <option>Food</option>
                  <option>Accessories</option>
                  <option>Medicine</option>
                  <option>Toys</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Product / Ad Title">
                <input
                  value={shopForm.title}
                  onChange={(e) =>
                    setShopForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Title"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Price">
                <input
                  value={shopForm.price}
                  onChange={(e) =>
                    setShopForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="Price"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Location">
                <input
                  value={shopForm.location}
                  onChange={(e) =>
                    setShopForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Full address"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Website / Contact Link">
                <input
                  value={shopForm.website}
                  onChange={(e) =>
                    setShopForm((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="Website or contact link"
                  style={inputStyle()}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={shopForm.description}
                onChange={(e) =>
                  setShopForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="What products or offers do you have?"
                style={inputStyle({ minHeight: 90 })}
              />
            </Field>

            <button onClick={addShop} style={buttonPrimary()}>
              Publish Shop Ad
            </button>
          </Card>

          {shops.map((shop) => (
            <Card key={shop.id}>
              <h3 style={{ marginTop: 0 }}>{shop.businessName}</h3>
              <p>
                <strong>Category:</strong> {shop.category}
              </p>
              <p>
                <strong>Offer:</strong> {shop.title}
              </p>
              <p>
                <strong>Price:</strong> {shop.price}
              </p>
              <p>
                <strong>Location:</strong> {shop.location}
              </p>
              <p>{shop.description}</p>
              {shop.website ? (
                <p>
                  <a href={shop.website} target="_blank" rel="noreferrer">
                    Visit business link
                  </a>
                </p>
              ) : null}
              <p>
                <strong>Verification:</strong>{" "}
                {shop.verified ? "Verified business" : "Standard business"}
              </p>
            </Card>
          ))}
        </>
      )}

      {marketSubTab === "reviews" && (
        <>
          <Card>
            <Title
              title="Add Review"
              subtitle="Rate sellers, buyers, shops, and service providers"
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <Field label="Target Name">
                <input
                  value={reviewForm.targetName}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      targetName: e.target.value,
                    }))
                  }
                  placeholder="Target name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Role">
                <select
                  value={reviewForm.role}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                  style={inputStyle()}
                >
                  <option>Seller</option>
                  <option>Buyer</option>
                  <option>Doctor</option>
                  <option>Pet Shop</option>
                  <option>Groomer</option>
                  <option>Trainer</option>
                </select>
              </Field>

              <Field label="Rating">
                <select
                  value={reviewForm.rating}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      rating: e.target.value,
                    }))
                  }
                  style={inputStyle()}
                >
                  <option>5</option>
                  <option>4</option>
                  <option>3</option>
                  <option>2</option>
                  <option>1</option>
                </select>
              </Field>
            </div>

            <Field label="Review">
              <textarea
                value={reviewForm.review}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    review: e.target.value,
                  }))
                }
                placeholder="Write your experience"
                style={inputStyle({ minHeight: 90 })}
              />
            </Field>

            <button onClick={addReview} style={buttonPrimary()}>
              Submit Review
            </button>
          </Card>

          {reviews.map((review) => (
            <Card key={review.id}>
              <h3 style={{ marginTop: 0 }}>{review.targetName}</h3>
              <p>
                <strong>Role:</strong> {review.role}
              </p>
              <p>
                <strong>Rating:</strong> {review.rating}/5
              </p>
              <p>
                <strong>By:</strong> {review.author}
              </p>
              <p>{review.review}</p>
            </Card>
          ))}
        </>
      )}
    </div>
  );

  const renderAdoption = () => (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Title
        title="Adoption Center"
        subtitle="Adopt pets, help shelters, and create rescue visibility worldwide"
      />

      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <Field label="Pet Name">
            <input
              value={adoptionForm.petName}
              onChange={(e) =>
                setAdoptionForm((prev) => ({
                  ...prev,
                  petName: e.target.value,
                }))
              }
              placeholder="Pet name"
              style={inputStyle()}
            />
          </Field>

          <Field label="Type">
            <select
              value={adoptionForm.type}
              onChange={(e) =>
                setAdoptionForm((prev) => ({
                  ...prev,
                  type: e.target.value,
                }))
              }
              style={inputStyle()}
            >
              <option>Dog</option>
              <option>Cat</option>
              <option>Bird</option>
              <option>Rabbit</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Location">
            <input
              value={adoptionForm.location}
              onChange={(e) =>
                setAdoptionForm((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              placeholder="Shelter or city address"
              style={inputStyle()}
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={adoptionForm.note}
            onChange={(e) =>
              setAdoptionForm((prev) => ({
                ...prev,
                note: e.target.value,
              }))
            }
            placeholder="Health, behavior, rescue story"
            style={inputStyle({ minHeight: 90 })}
          />
        </Field>

        <button onClick={addAdoption} style={buttonPrimary()}>
          Add Adoption Listing
        </button>
      </Card>

      {adoptions.map((pet) => (
        <Card key={pet.id}>
          <h3 style={{ marginTop: 0 }}>{pet.petName}</h3>
          <p>
            <strong>Type:</strong> {pet.type}
          </p>
          <p>
            <strong>Location:</strong> {pet.location}
          </p>
          <p>{pet.note}</p>
          <button
            onClick={() =>
              addNotification(
                `Adoption request started for ${pet.petName}.`,
                "adoption"
              )
            }
            style={buttonPrimary()}
          >
            Apply to Adopt
          </button>
        </Card>
      ))}
    </div>
  );

  const renderServices = () => (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Title
        title="Services & Care"
        subtitle="Doctors, appointments, vaccine tracking, and nearby care support"
      />

      <div style={{ marginBottom: 10 }}>
        <button
          onClick={() => setServiceSubTab("overview")}
          style={buttonSecondary()}
        >
          Overview
        </button>
        <button
          onClick={() => setServiceSubTab("doctors")}
          style={buttonSecondary()}
        >
          Doctors
        </button>
        <button
          onClick={() => setServiceSubTab("appointments")}
          style={buttonSecondary()}
        >
          Appointments
        </button>
        <button
          onClick={() => setServiceSubTab("vaccines")}
          style={buttonSecondary()}
        >
          Vaccines
        </button>
      </div>

      {serviceSubTab === "overview" && (
        <>
          <Card>
            <h3 style={{ marginTop: 0 }}>Vet Appointment</h3>
            <p>Book checkups, emergency visits, and health consultations.</p>
          </Card>
          <Card>
            <h3 style={{ marginTop: 0 }}>Vaccination Tracking</h3>
            <p>Track completed vaccines and see next due dates.</p>
          </Card>
          <Card>
            <h3 style={{ marginTop: 0 }}>Doctor Profiles</h3>
            <p>
              Pet doctors can create profiles and connect directly with owners.
            </p>
          </Card>
        </>
      )}

      {serviceSubTab === "doctors" && (
        <>
          <Card>
            <Title
              title="Doctor Profile Registration"
              subtitle="Pet doctors can create verified public profiles"
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <Field label="Doctor Name">
                <input
                  value={doctorForm.name}
                  onChange={(e) =>
                    setDoctorForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Doctor name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Specialty">
                <input
                  value={doctorForm.specialty}
                  onChange={(e) =>
                    setDoctorForm((prev) => ({
                      ...prev,
                      specialty: e.target.value,
                    }))
                  }
                  placeholder="General Vet / Surgery / Wellness"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Clinic">
                <input
                  value={doctorForm.clinic}
                  onChange={(e) =>
                    setDoctorForm((prev) => ({
                      ...prev,
                      clinic: e.target.value,
                    }))
                  }
                  placeholder="Clinic"
                  style={inputStyle()}
                />
              </Field>

              <Field label="City">
                <input
                  value={doctorForm.city}
                  onChange={(e) =>
                    setDoctorForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  placeholder="City"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Country">
                <select
                  value={doctorForm.country}
                  onChange={(e) =>
                    setDoctorForm((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  style={inputStyle()}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
              </Field>

              <Field label="Government / License ID">
                <input
                  value={doctorForm.licenseId}
                  onChange={(e) =>
                    setDoctorForm((prev) => ({
                      ...prev,
                      licenseId: e.target.value,
                    }))
                  }
                  placeholder="License ID"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Next Available">
                <input
                  value={doctorForm.nextAvailable}
                  onChange={(e) =>
                    setDoctorForm((prev) => ({
                      ...prev,
                      nextAvailable: e.target.value,
                    }))
                  }
                  placeholder="Tomorrow 10:00 AM"
                  style={inputStyle()}
                />
              </Field>
            </div>

            <button onClick={addDoctor} style={buttonPrimary()}>
              Create Doctor Profile
            </button>
          </Card>

          {doctors.map((doctor) => (
            <Card key={doctor.id}>
              <h3 style={{ marginTop: 0 }}>{doctor.name}</h3>
              <p>
                <strong>Specialty:</strong> {doctor.specialty}
              </p>
              <p>
                <strong>Clinic:</strong> {doctor.clinic}
              </p>
              <p>
                <strong>Location:</strong> {doctor.city}, {doctor.country}
              </p>
              <p>
                <strong>Next Available:</strong> {doctor.nextAvailable}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {doctor.verified ? "Verified doctor" : "Pending"}
              </p>
            </Card>
          ))}
        </>
      )}

      {serviceSubTab === "appointments" && (
        <>
          <Card>
            <Title
              title="Book Doctor Appointment"
              subtitle="Schedule pet health visits and connect through maps"
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <Field label="Pet Name">
                <input
                  value={appointmentForm.petName}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({
                      ...prev,
                      petName: e.target.value,
                    }))
                  }
                  placeholder="Pet name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Doctor Name">
                <input
                  value={appointmentForm.doctorName}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({
                      ...prev,
                      doctorName: e.target.value,
                    }))
                  }
                  placeholder="Doctor name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Appointment Date">
                <input
                  value={appointmentForm.appointmentDate}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({
                      ...prev,
                      appointmentDate: e.target.value,
                    }))
                  }
                  placeholder="Date and time"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Clinic Address">
                <input
                  value={appointmentForm.clinicAddress}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({
                      ...prev,
                      clinicAddress: e.target.value,
                    }))
                  }
                  placeholder="Clinic address"
                  style={inputStyle()}
                />
              </Field>
            </div>

            <Field label="Reason">
              <textarea
                value={appointmentForm.reason}
                onChange={(e) =>
                  setAppointmentForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="Why are you visiting?"
                style={inputStyle({ minHeight: 90 })}
              />
            </Field>

            <button onClick={addAppointment} style={buttonPrimary()}>
              Book Appointment
            </button>
          </Card>

          {appointments.map((item) => (
            <Card key={item.id}>
              <h3 style={{ marginTop: 0 }}>{item.petName}</h3>
              <p>
                <strong>Doctor:</strong> {item.doctorName}
              </p>
              <p>
                <strong>Date:</strong> {item.appointmentDate}
              </p>
              <p>
                <strong>Reason:</strong> {item.reason}
              </p>
              <p>
                <strong>Clinic Address:</strong> {item.clinicAddress}
              </p>
              {item.clinicAddress ? (
                <p>
                  <a
                    href={mapLink(item.clinicAddress)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open clinic in Google Maps
                  </a>
                </p>
              ) : null}
            </Card>
          ))}
        </>
      )}

      {serviceSubTab === "vaccines" && (
        <>
          <Card>
            <Title
              title="Vaccination Record"
              subtitle="Store completed vaccines and track next due dates"
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <Field label="Pet Name">
                <input
                  value={vaccineForm.petName}
                  onChange={(e) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      petName: e.target.value,
                    }))
                  }
                  placeholder="Pet name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Vaccine Name">
                <input
                  value={vaccineForm.vaccineName}
                  onChange={(e) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      vaccineName: e.target.value,
                    }))
                  }
                  placeholder="Vaccine name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Completed Date">
                <input
                  value={vaccineForm.completedDate}
                  onChange={(e) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      completedDate: e.target.value,
                    }))
                  }
                  placeholder="Completed date"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Next Due Date">
                <input
                  value={vaccineForm.nextDueDate}
                  onChange={(e) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      nextDueDate: e.target.value,
                    }))
                  }
                  placeholder="Next due date"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Clinic Name">
                <input
                  value={vaccineForm.clinicName}
                  onChange={(e) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      clinicName: e.target.value,
                    }))
                  }
                  placeholder="Clinic name"
                  style={inputStyle()}
                />
              </Field>

              <Field label="Clinic Address">
                <input
                  value={vaccineForm.clinicAddress}
                  onChange={(e) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      clinicAddress: e.target.value,
                    }))
                  }
                  placeholder="Clinic address"
                  style={inputStyle()}
                />
              </Field>
            </div>

            <button onClick={addVaccine} style={buttonPrimary()}>
              Save Vaccine Record
            </button>
          </Card>

          {vaccines.map((item) => (
            <Card key={item.id}>
              <h3 style={{ marginTop: 0 }}>{item.petName}</h3>
              <p>
                <strong>Vaccine:</strong> {item.vaccineName}
              </p>
              <p>
                <strong>Completed:</strong> {item.completedDate}
              </p>
              <p>
                <strong>Next Due:</strong> {item.nextDueDate}
              </p>
              <p>
                <strong>Clinic:</strong> {item.clinicName}
              </p>
              <p>
                <strong>Address:</strong> {item.clinicAddress}
              </p>
              {item.clinicAddress ? (
                <p>
                  <a
                    href={mapLink(item.clinicAddress)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Find clinic on Google Maps
                  </a>
                </p>
              ) : null}
            </Card>
          ))}
        </>
      )}
    </div>
  );

  const renderChat = () => (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Title
        title="Messages"
        subtitle="Chat with buyers, sellers, doctors, and service providers"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 16,
        }}
      >
        <Card>
          {messages.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              style={{
                padding: 12,
                borderRadius: 8,
                cursor: "pointer",
                background:
                  selectedChatId === chat.id ? "#e5e7eb" : "transparent",
                marginBottom: 8,
              }}
            >
              <strong>{chat.with}</strong>
              <p style={{ margin: "6px 0 0 0", color: "#4b5563" }}>
                {chat.lastMessage}
              </p>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>{selectedChat?.with || "No chat"}</h3>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
              minHeight: 260,
              maxHeight: 340,
              overflowY: "auto",
              background: "#f9fafb",
            }}
          >
            {selectedChat?.messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  textAlign: msg.sender === "You" ? "right" : "left",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    background: msg.sender === "You" ? "#111827" : "white",
                    color: msg.sender === "You" ? "white" : "#111827",
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    maxWidth: "80%",
                  }}
                >
                  <strong>{msg.sender}</strong>
                  <div>{msg.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Write a message"
              style={inputStyle()}
            />
            <button onClick={sendMessage} style={buttonPrimary()}>
              Send
            </button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderLostFound = () => (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Title
        title="Lost & Found"
        subtitle="Help reunite pets with their families"
      />

      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <Field label="Pet Name">
            <input
              value={lostFoundForm.petName}
              onChange={(e) =>
                setLostFoundForm((prev) => ({
                  ...prev,
                  petName: e.target.value,
                }))
              }
              placeholder="Pet name"
              style={inputStyle()}
            />
          </Field>

          <Field label="Status">
            <select
              value={lostFoundForm.status}
              onChange={(e) =>
                setLostFoundForm((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              style={inputStyle()}
            >
              <option>Lost</option>
              <option>Found</option>
            </select>
          </Field>

          <Field label="Last Seen / Found At">
            <input
              value={lostFoundForm.lastSeen}
              onChange={(e) =>
                setLostFoundForm((prev) => ({
                  ...prev,
                  lastSeen: e.target.value,
                }))
              }
              placeholder="Location"
              style={inputStyle()}
            />
          </Field>
        </div>

        <Field label="Details">
          <textarea
            value={lostFoundForm.details}
            onChange={(e) =>
              setLostFoundForm((prev) => ({
                ...prev,
                details: e.target.value,
              }))
            }
            placeholder="Description, contact info, timing"
            style={inputStyle({ minHeight: 90 })}
          />
        </Field>

        <button onClick={addLostFound} style={buttonPrimary()}>
          Publish Alert
        </button>
      </Card>

      {lostFoundPosts.map((item) => (
        <Card key={item.id}>
          <h3 style={{ marginTop: 0 }}>{item.petName}</h3>
          <p>
            <strong>Status:</strong> {item.status}
          </p>
          <p>
            <strong>Location:</strong> {item.lastSeen}
          </p>
          <p>{item.details}</p>
          <p>
            <a href={mapLink(item.lastSeen)} target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
          </p>
        </Card>
      ))}
    </div>
  );

  const renderProfile = () => (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Title
        title="Profile"
        subtitle="Manage your personal details, trust verification, and settings"
      />

      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <Field label="Full Name">
            <input
              value={profile.fullName}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, fullName: e.target.value }))
              }
              style={inputStyle()}
            />
          </Field>

          <Field label="Email">
            <input
              value={profile.email}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, email: e.target.value }))
              }
              style={inputStyle()}
            />
          </Field>

          <Field label="Phone">
            <input
              value={profile.phone}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, phone: e.target.value }))
              }
              style={inputStyle()}
            />
          </Field>

          <Field label="Country">
            <select
              value={profile.country}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, country: e.target.value }))
              }
              style={inputStyle()}
            >
              {COUNTRIES.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>
          </Field>

          <Field label="Full Address">
            <input
              value={profile.address}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, address: e.target.value }))
              }
              style={inputStyle()}
            />
          </Field>

          <Field label="Government-Issued ID Number">
            <input
              value={profile.governmentId}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  governmentId: e.target.value,
                }))
              }
              style={inputStyle()}
            />
          </Field>
        </div>

        <Field label="Bio">
          <textarea
            value={profile.bio}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, bio: e.target.value }))
            }
            style={inputStyle({ minHeight: 90 })}
          />
        </Field>

        <button onClick={updateProfile} style={buttonPrimary()}>
          Update Profile
        </button>
        <button
          onClick={() => window.open(mapLink(profile.address), "_blank")}
          style={buttonSecondary()}
        >
          Open Home Address in Google Maps
        </button>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Account Activation & Verification</h3>

        <p>
          <strong>Account Status:</strong>{" "}
          {profile.accountStatus === "Active" ? "Active ✅" : "Pending ⏳"}
        </p>

        <p>
          <strong>Email Verified:</strong>{" "}
          {profile.verifiedEmail ? "Yes ✅" : "No ❌"}
        </p>

        <p>
          <strong>Government ID Submitted:</strong>{" "}
          {profile.governmentId ? "Yes ✅" : "No ❌"}
        </p>

        <p>
          <strong>Government ID Verified:</strong>{" "}
          {profile.verifiedId ? "Approved ✅" : "Pending ⏳"}
        </p>

        <p>
          <strong>Seller Verification:</strong>{" "}
          {profile.verifiedSeller ? "Approved ✅" : "Pending ⏳"}
        </p>

        <p>
          <strong>Doctor Verification:</strong>{" "}
          {profile.verifiedDoctor ? "Approved ✅" : "Pending ⏳"}
        </p>

        <p>
          <strong>Business Verification:</strong>{" "}
          {profile.verifiedBusiness ? "Approved ✅" : "Pending ⏳"}
        </p>

        <p>
          <strong>Role:</strong> {profile.role}
        </p>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Platform Summary</h3>
        <p>
          <strong>Total Posts:</strong> {stats.posts}
        </p>
        <p>
          <strong>Total Pet Profiles:</strong> {stats.pets}
        </p>
        <p>
          <strong>Total Listings:</strong> {stats.listings}
        </p>
        <p>
          <strong>Total Shop Ads:</strong> {stats.shops}
        </p>
        <p>
          <strong>Total Doctors:</strong> {stats.doctors}
        </p>
        <p>
          <strong>Total Vaccine Records:</strong> {stats.vaccines}
        </p>
        <p>
          <strong>Total Appointments:</strong> {stats.appointments}
        </p>
        <p>
          <strong>Total Adoption Listings:</strong> {stats.adoptions}
        </p>
        <p>
          <strong>Total Reviews:</strong> {stats.reviews}
        </p>
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Title
        title="Notifications"
        subtitle="Security, marketplace, health, and social updates"
      />

      {notifications.map((item) => (
        <Card key={item.id}>
          <p style={{ margin: 0 }}>
            <strong>{item.type.toUpperCase()}:</strong> {item.text}
          </p>
        </Card>
      ))}
    </div>
  );

  const renderDashboard = () => (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Title
        title="Admin / Launch Dashboard"
        subtitle="Quick snapshot of the current frontend demo"
      />

      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <strong>Posts:</strong> {stats.posts}
          </div>
          <div>
            <strong>Pet Profiles:</strong> {stats.pets}
          </div>
          <div>
            <strong>Listings:</strong> {stats.listings}
          </div>
          <div>
            <strong>Shops:</strong> {stats.shops}
          </div>
          <div>
            <strong>Doctors:</strong> {stats.doctors}
          </div>
          <div>
            <strong>Vaccines:</strong> {stats.vaccines}
          </div>
          <div>
            <strong>Appointments:</strong> {stats.appointments}
          </div>
          <div>
            <strong>Adoptions:</strong> {stats.adoptions}
          </div>
          <div>
            <strong>Reviews:</strong> {stats.reviews}
          </div>
        </div>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Launch Notes</h3>
        <p>
          This frontend demo includes real Firebase signup/login with email
          verification, government ID field, map links, social feed, pet
          profiles, verified marketplace, pet shops, adoption, doctors,
          appointments, vaccines, chat, lost & found, notifications, and profile
          management.
        </p>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "feed":
        return renderFeed();
      case "pets":
        return renderPetProfiles();
      case "marketplace":
        return renderMarketplace();
      case "adoption":
        return renderAdoption();
      case "services":
        return renderServices();
      case "messages":
        return renderChat();
      case "lostfound":
        return renderLostFound();
      case "profile":
        return renderProfile();
      case "notifications":
        return renderNotifications();
      case "dashboard":
        return renderDashboard();
      default:
        return renderFeed();
    }
  };

  if (!user) {
    return renderAuth();
  }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
        background: "#f3f4f6",
      }}
    >
      <div
        style={{
          background: "#111827",
          color: "white",
          padding: 20,
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>🐾 PetConnect</h1>
        <p style={{ marginTop: 8 }}>
          Worldwide trusted pet social, marketplace, business, and care platform
        </p>
        <button onClick={logout} style={buttonSecondary()}>
          Logout
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          padding: 14,
          background: "white",
          borderBottom: "1px solid #d1d5db",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => setActiveTab("feed")} style={buttonSecondary()}>
          Feed
        </button>
        <button onClick={() => setActiveTab("pets")} style={buttonSecondary()}>
          Pet Profiles
        </button>
        <button
          onClick={() => setActiveTab("marketplace")}
          style={buttonSecondary()}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab("adoption")}
          style={buttonSecondary()}
        >
          Adoption
        </button>
        <button
          onClick={() => setActiveTab("services")}
          style={buttonSecondary()}
        >
          Services
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          style={buttonSecondary()}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab("lostfound")}
          style={buttonSecondary()}
        >
          Lost & Found
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          style={buttonSecondary()}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          style={buttonSecondary()}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={buttonSecondary()}
        >
          Dashboard
        </button>
      </div>

      <div style={{ padding: 24 }}>{renderContent()}</div>
    </div>
  );
}
