const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const UserModel = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
// const Event = require("./models/Event");
// const Ticket = require("./models/Ticket");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { log } = require("console");
// const TicketModel = require("./models/Ticket");
const KEY = "rzp_test_9pvIQ4B6FWjGWz";
const SECRET = "3V9LWX8WFJRlRF52FM7cofTq";
const app = express();
const fs=require('fs');
const reqRouter = require('./router/request.routers')

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "bsbsfbrnsftentwnnwn";
const JoinedUser = require("./models/JoinedUser")

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.resolve("./public")));
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend.vercel.app"
];

app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
  })
);

app.use("/req", reqRouter);

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("Database connected");
});
const authenticateToken = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, jwtSecret, {}, (err, userData) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = userData;
    next();
  });
};

const adminOnly = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};


// Routes

//video upload and get

// Enhanced logging middleware
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   next();
// });

// Ensure public/uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads','video');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory: ${uploadDir}`);
}

// Enhanced Multer configuration
const storageVid = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`Destination directory: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    console.log(`Generated filename: ${uniqueName}`);
    cb(null, uniqueName);
  }
});

const uploadVid = multer({
  storage: storageVid,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    console.log(`Incoming file: ${file.originalname}, type: ${file.mimetype}`);
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Upload endpoint with detailed logging
app.post('/api/upload', (req, res, next) => {
  console.log('Upload request received, checking headers...');
  console.log('Content-Type:', req.headers['content-type']);
  next();
}, uploadVid.single('video'), (req, res) => {
  try {
    if (!req.file) {
      console.log('No file was uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File successfully saved:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });

    const video = {
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      uploadDate: new Date(),
      size: req.file.size
    };

    res.status(200).json(video);
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
});

// Get all videos
app.get('/api/videos', (req, res) => {
  const uploadDir = path.join(__dirname, 'public', 'uploads','video');
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Directory doesn't exist yet (no uploads)
        return res.json([]);
      }
      return res.status(500).json({ error: 'Unable to scan directory' });
    }
    
    const videos = files.map(file => ({
      filename: file,
      path: `/uploads/${file}`,
      uploadDate: fs.statSync(path.join(uploadDir, file)).birthtime
    }));
    
    res.json(videos);
  });
});


// SCHEDULE MEETING

app.post('/schedule-meeting', authenticateToken, async (req, res) => {
  try {
    const { date, time, title, description } = req.body;

    const { id } = req.user;
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if the user exists
    const user = await UserModel.findById(id);
    const userEmail = user?.email || 'user@example.com';

    // Generate a Google Meet link (in a real app, you'd use Google Calendar API)
    // This is a placeholder format - real Google Meet links have a different format
    const meetingId = `meet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const googleMeetLink = "https://meet.google.com/avi-zbkz-cid";

    // Format date and time for email
    const meetingDate = new Date(`${date}T${time}`);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Prepare email content
    const mailOptions = {
      from: "no-reply@gmail.com",
      to: userEmail,
      subject: `Meeting Scheduled: ${title}`,
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Your Meeting Has Been Scheduled</h2>
              <p>Your meeting "${title}" has been scheduled for ${formattedDate} at ${formattedTime}.</p>
              
              ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
              
              <p><strong>Google Meet Link:</strong> <a href="${googleMeetLink}" target="_blank">${googleMeetLink}</a></p>
              
              <p>You can add this meeting to your calendar using the link below:</p>
              <p><a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${encodeURIComponent(meetingDate.toISOString().replace(/-|:|\.\d+/g, ''))}&details=${encodeURIComponent(description || '')}" target="_blank">Add to Google Calendar</a></p>
              
              <p>Thank you for using our meeting scheduler!</p>
            </div>
          `
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Meeting scheduled successfully',
      meetLink: googleMeetLink
    });

  } catch (error) {
    console.log("Backend eror in Scheduling Interview", error);

    res.status(400).send("Backend eror in Scheduling Interview",error);
  }
})

app.get("/getUser", authenticateToken, async (req, res) => {
  try {
    const { id } = req.user;
    //console.log("User ID:", id);

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if the user exists
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(400).json({ message: "User ID is required" });
    }
    res.status(200).json(user);

  } catch (error) {
    console.log("Backend eror in getUser", error);

    res.status(400).send(error);
  }
})

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Kindly fill all details" });
  }

  const existingUser = await UserModel.findOne({ email: email });

  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User already exists, please login" });
  }

  try {
    const userDoc = await UserModel.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userDoc = await UserModel.findOne({ email });
    if (!userDoc) {
      return res.status(404).json({ error: "Email does not match" });
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) {
      return res.status(401).json({ error: "Wrong password" });
    }

    jwt.sign(
      {
        email: userDoc.email,
        id: userDoc._id,
      },
      jwtSecret,
      {},
      (err, token) => {
        if (err) {
          console.error("JWT Error:", err);
          return res.status(500).json({ error: "Failed to generate token" });
        }

        res
          .cookie("token", token, { httpOnly: true, secure: true })
          .json(userDoc);
      }
    );
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//user edit
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads"); // Save files in the "uploads/resumes" directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Generate a unique file name
  },
});

const upload = multer({ storage });

// Edit User Route
app.post("/editUser", authenticateToken, upload.single("resume"), async (req, res) => {
  try {
    const { id } = req.user; // Extract user ID from the authenticated token
    const { name } = req.body; // Extract name from the request body
    const resumeFile = req.file; // Extract uploaded resume file

    // Prepare the update object
    const updateData = {};
    if (name) {
      updateData.name = name; // Update name if provided
    }
    if (resumeFile) {
      updateData.resume = resumeFile.filename; // Update resume file name if provided
    }

    // Update the user in the database
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).send({ message: "Profile Updated", data: updatedUser });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update Profile data" });
  }
});

//get profile
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { id } = req.user;
    const { name, email, _id, role } = await UserModel.findById(id);
    res.status(200).json({ name, email, _id, role });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

// app.post(
//   "/createEvent",
//   authenticateToken,
//   adminOnly,
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const eventData = req.body;
//       eventData.image = req.file ? `/uploads/${req?.file?.filename}` : "";

//       const newEvent = new Event(eventData);
//       await newEvent.save();
//       console.log("Event Created:", newEvent._id);

//       const { id } = req.user;
//       if (!id) {
//         return res.status(400).json({ message: "User ID is required" });
//       }

//       // Check if the user exists
//       const user = await UserModel.findById(id);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       // Push the event's ObjectId into eventsCreated
//       const updatedUser = await UserModel.findByIdAndUpdate(
//         id,
//         { $push: { eventsCreated: newEvent._id } },
//         { new: true }
//       );

//       if (!updatedUser) {
//         console.log("User update failed.");
//         return res.status(500).json({ message: "Failed to update user's events" });
//       }

//       console.log("Updated User:", updatedUser);

//       // Fetch all emails from JoinedUser model
//       const users = await JoinedUser.find({}, { email: 1, _id: 0 });
//       const emails = users.map((user) => user.email);

//       if (emails.length === 0) {
//         console.log("No users found to send emails.");
//       } else {
//         // Configure nodemailer transporter
//         const transporter = nodemailer.createTransport({
//           service: "gmail",
//           auth: {
//             user: process.env.MAIL_USER,
//             pass: process.env.MAIL_PASS,
//           },
//         });

//         // Send email to all users
//         for (const email of emails) {
//           try {
//             await transporter.sendMail({
//               from: "no-reply@gmail.com",
//               to: email,
//               subject: "New Event Created",
//               html: `<h2>Hello,</h2>
//                      <p>A new event "${newEvent.title}" has been created!</p>
//                      <p>Details:</p>
//                      <ul>
//                        <li><b>Title:</b> ${newEvent.title}</li>
//                        <li><b>Date:</b> ${newEvent.date}</li>
//                        <li><b>Description:</b> ${newEvent.description}</li>
//                      </ul>
//                      <p>Check it out on our platform!</p>`,
//             });
//             console.log(`Email sent to: ${email}`);
//           } catch (emailError) {
//             console.error(`Failed to send email to: ${email}`, emailError);
//           }
//         }
//       }

//       res.status(201).json(newEvent);
//     } catch (error) {
//       console.error("Error creating event:", error);
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

//Interview Question mail : 

app.post('/send-interview-responses', async (req, res) => {
  const { responses, email } = req.body;

  // Validate input
  if (!email || !responses || !Array.isArray(responses)) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  // Generate HTML email content
  const emailHtml = `
    <html>
      <body>
        <h1>Interview Preparation Responses</h1>
        ${responses.map(resp => `
          <div>
            <h2>${resp.category} Question</h2>
            <p><strong>Q: ${resp.question}</strong></p>
            <p>A: ${resp.answer || 'No answer provided'}</p>
          </div>
        `).join('<hr/>')}
        <p>Generated by Interview Preparation App</p>
      </body>
    </html>
  `;

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Interview Preparation Responses',
    html: emailHtml
  };

  try {
    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Responses sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

// app.get("/createEvent", async (req, res) => {
//   try {
//     const events = await Event.find();
//     res.status(200).json(events);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch events from MongoDB" });
//   }
// });

// app.get("/event/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const event = await Event.findById(id).populate("ticketSold");
//     res.json(event);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch event from MongoDB" });
//   }
// });

// app.post("/event/:eventId", async (req, res) => {
//   const eventId = req.params.eventId;
//   try {
//     const event = await Event.findById(eventId);

//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     event.likes += 1;
//     const updatedEvent = await event.save();

//     res.json(updatedEvent);
//   } catch (error) {
//     console.error("Error liking the event:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// app.delete(
//   "/admin/event/:id",
//   authenticateToken,
//   adminOnly,
//   async (req, res) => {
//     const eventId = req.params.id;

//     try {
//       const event = await Event.findById(eventId);

//       if (!event) {
//         return res.status(404).json({ error: "Event not found" });
//       }

//       await Event.findByIdAndDelete(eventId);
//       const { id } = req.user;
//       if (!id) {
//         return res.status(400).json({ message: "User ID is required" });
//       }

//       // Check if the user exists
//       const user = await UserModel.findById(id);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       // Push the event's ObjectId into eventsCreated
//       // const updatedUser = await UserModel.findByIdAndUpdate(
//       //   id,
//       //   { $pop: { eventsCreated: eventId } },
//       //   { new: true }
//       // );

//       // if (!updatedUser) {
//       //   console.log("User update failed.");
//       //   return res.status(500).json({ message: "Failed to update user's events" });
//       // }
//       res.status(200).json({ message: "Event deleted successfully" });
//     } catch (error) {
//       console.error("Error deleting event:", error);
//       res.status(500).json({ error: "Failed to delete event" });
//     }
//   }
// );


// app.post("/tickets", async (req, res) => {
//   try {
//     const ticketDetails = req.body;
//     const newTicket = new Ticket(ticketDetails);

//     await newTicket.save();
//     console.log("New TIIICKETTTT:", newTicket);
//     const eventId = newTicket.eventid;
//     // Push the event's ObjectId into eventsCreated
//     const updatedEvent = await Event.findByIdAndUpdate(
//       eventId,
//       { $push: { ticketSold: newTicket._id } },
//       { new: true }
//     );
//     return res.status(201).json({ ticket: newTicket });
//   } catch (error) {
//     console.error("Error creating ticket:", error);
//     return res.status(500).json({ error: "Failed to create ticket" });
//   }
// });

// app.get("/event/:id/ordersummary", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const event = await Event.findById(id);
//     res.json(event);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch event from MongoDB" });
//   }
// });

// app.get("/event/:id/ordersummary/paymentsummary", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const event = await Event.findById(id);
//     res.json(event);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch event from MongoDB" });
//   }
// });

// app.get("/tickets/user/:userId", async (req, res) => {
//   const userId = req.params.userId;

//   try {
//     const tickets = await Ticket.find({ userid: userId });
//     res.json(tickets);
//   } catch (error) {
//     console.error("Error fetching user tickets:", error);
//     res.status(500).json({ error: "Failed to fetch user tickets" });
//   }
// });

// app.delete("/tickets/:id", async (req, res) => {
//   try {
//     const ticketId = req.params.id;
//     await Ticket.findByIdAndDelete(ticketId);
//     res.status(204).send();
//   } catch (error) {
//     console.error("Error deleting ticket:", error);
//     res.status(500).json({ error: "Failed to delete ticket" });
//   }
// });

// app.get("/tickets/check", async (req, res) => {
//   const { userid, eventid } = req.query;
//   // const id = '66d40503b39e7cd6777305da';
//   try {
//     // Find one ticket that matches the userid and eventid
//     const ticket = await Ticket.findOne({ userid, eventid });
//     console.log(ticket);
//     if (ticket) {
//       res.json({ message: "false" });
//     } else res.json({ exists: !!ticket });
//   } catch (error) {
//     console.error("Error checking ticket:", error);
//     res.status(500).json({ error: "Failed to check ticket" });
//   }
// });

//news letter nodemailer

app.post("/newsletter", async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // Check if the email already exists
    const existingUser = await JoinedUser.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already subscribed" });
    }

    // Create a new user
    const newUser = await JoinedUser.create({ email });

    // Configure the transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Send a welcome email
    let info = await transporter.sendMail({
      from: "no-reply@gmail.com",
      to: email,
      subject: "Welcome to Elev8!",
      html: `<h2>Hello, ${email}</h2> 
             <p>Welcome to Elev8</p>
             <br>
             <p>Thank you for joining us!</p>`,
    });

    console.log("Email sent successfully:", info);

    res.status(201).json({ message: "Successfully subscribed!" });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already subscribed" });
    }

    console.error("Error in newsletter subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
