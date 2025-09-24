const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware
app.use(cors());
app.use(express.json());


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas and Models ---
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', adminSchema);

const internshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  duration: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Internship = mongoose.model('Internship', internshipSchema);

const placementSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  employer: { type: String, required: true },
  appointmentNo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Placement = mongoose.model('Placement', placementSchema);

const achievementSchema = new mongoose.Schema({
  regNo: { type: String, required: true },
  name: { type: String, required: true },
  achievement: { type: String, required: true },
  prizes: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Achievement = mongoose.model('Achievement', achievementSchema);

const workshopSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  venue: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Workshop = mongoose.model('Workshop', workshopSchema);

const developerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  regNo: { type: String, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Developer = mongoose.model('Developer', developerSchema);




// --- JWT Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---
app.post('/api/adminlogin', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

app.post('/api/create-admin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({ username, password: hashedPassword });
        await newAdmin.save();
        res.status(201).json({ message: 'Admin user created successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Admin username already exists' });
        }
        res.status(500).json({ message: 'Error creating admin user', error: error.message });
    }
});

app.get('/api/internships', authenticateToken, async (req, res) => {
  try {
    const internships = await Internship.find().sort({ createdAt: -1 });
    res.json(internships);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching internships', error });
  }
});

app.post('/api/internships', authenticateToken, async (req, res) => {
  const { title, company, duration, description } = req.body;
  try {
    const newInternship = new Internship({ title, company, duration, description });
    await newInternship.save();
    res.status(201).json(newInternship);
  } catch (error) {
    res.status(400).json({ message: 'Error adding internship', error });
  }
});

app.put('/api/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, company, duration, description } = req.body;
  try {
    const updatedInternship = await Internship.findByIdAndUpdate(
      id,
      { title, company, duration, description },
      { new: true, runValidators: true }
    );
    if (!updatedInternship) {
      return res.status(404).json({ message: 'Internship not found' });
    }
    res.json(updatedInternship);
  } catch (error) {
    res.status(400).json({ message: 'Error updating internship', error });
  }
});

app.delete('/api/internships/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deletedInternship = await Internship.findByIdAndDelete(id);
    if (!deletedInternship) {
      return res.status(404).json({ message: 'Internship not found' });
    }
    res.json({ message: 'Internship deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting internship', error });
  }
});

app.get('/api/placements', authenticateToken, async (req, res) => {
  try {
    const placements = await Placement.find().sort({ createdAt: -1 });
    res.json(placements);
  } catch (error) { res.status(500).json({ message: 'Error fetching placements', error }); }
});

app.post('/api/placements', authenticateToken, async (req, res) => {
  const { rollNo, studentName, employer, appointmentNo } = req.body;
  try {
    const newPlacement = new Placement({ rollNo, studentName, employer, appointmentNo });
    await newPlacement.save();
    res.status(201).json(newPlacement);
  } catch (error) { res.status(400).json({ message: 'Error adding placement', error }); }
});

app.put('/api/placements/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { rollNo, studentName, employer, appointmentNo } = req.body;
  try {
    const updatedPlacement = await Placement.findByIdAndUpdate(id, { rollNo, studentName, employer, appointmentNo }, { new: true });
    if (!updatedPlacement) return res.status(404).json({ message: 'Placement not found' });
    res.json(updatedPlacement);
  } catch (error) { res.status(400).json({ message: 'Error updating placement', error }); }
});

app.delete('/api/placements/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deletedPlacement = await Placement.findByIdAndDelete(id);
    if (!deletedPlacement) return res.status(404).json({ message: 'Placement not found' });
    res.json({ message: 'Placement deleted successfully' });
  } catch (error) { res.status(500).json({ message: 'Error deleting placement', error }); }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// --- Achievement Routes (Protected) ---
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ createdAt: -1 });
    res.json(achievements);
  } catch (error) { res.status(500).json({ message: 'Error fetching achievements', error }); }
});

app.post('/api/achievements', authenticateToken, async (req, res) => {
  const { regNo, name, achievement, prizes } = req.body;
  try {
    const newAchievement = new Achievement({ regNo, name, achievement, prizes });
    await newAchievement.save();
    res.status(201).json(newAchievement);
  } catch (error) { res.status(400).json({ message: 'Error adding achievement', error }); }
});

app.put('/api/achievements/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { regNo, name, achievement, prizes } = req.body;
  try {
    const updatedAchievement = await Achievement.findByIdAndUpdate(id, { regNo, name, achievement, prizes }, { new: true });
    if (!updatedAchievement) return res.status(404).json({ message: 'Achievement not found' });
    res.json(updatedAchievement);
  } catch (error) { res.status(400).json({ message: 'Error updating achievement', error }); }
});

app.delete('/api/achievements/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deletedAchievement = await Achievement.findByIdAndDelete(id);
    if (!deletedAchievement) return res.status(404).json({ message: 'Achievement not found' });
    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) { res.status(500).json({ message: 'Error deleting achievement', error }); }
});



// --- Workshop Routes (Protected) ---
app.get('/api/workshops', authenticateToken, async (req, res) => {
  try {
    const workshops = await Workshop.find().sort({ createdAt: -1 });
    res.json(workshops);
  } catch (error) { res.status(500).json({ message: 'Error fetching workshops', error }); }
});

app.post('/api/workshops', authenticateToken, async (req, res) => {
  const { title, description, date, venue } = req.body;
  try {
    const newWorkshop = new Workshop({ title, description, date, venue });
    await newWorkshop.save();
    res.status(201).json(newWorkshop);
  } catch (error) { res.status(400).json({ message: 'Error adding workshop', error }); }
});

app.put('/api/workshops/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, date, venue } = req.body;
  try {
    const updatedWorkshop = await Workshop.findByIdAndUpdate(id, { title, description, date, venue }, { new: true });
    if (!updatedWorkshop) return res.status(404).json({ message: 'Workshop not found' });
    res.json(updatedWorkshop);
  } catch (error) { res.status(400).json({ message: 'Error updating workshop', error }); }
});

app.delete('/api/workshops/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deletedWorkshop = await Workshop.findByIdAndDelete(id);
    if (!deletedWorkshop) return res.status(404).json({ message: 'Workshop not found' });
    res.json({ message: 'Workshop deleted successfully' });
  } catch (error) { res.status(500).json({ message: 'Error deleting workshop', error }); }
});


// --- Developer Routes (Protected) ---
app.get('/api/developers', authenticateToken, async (req, res) => {
  try {
    const developers = await Developer.find().sort({ createdAt: -1 });
    res.json(developers);
  } catch (error) { res.status(500).json({ message: 'Error fetching developers', error }); }
});

app.post('/api/developers', authenticateToken, async (req, res) => {
  const { name, regNo, image } = req.body;
  try {
    const newDeveloper = new Developer({ name, regNo, image });
    await newDeveloper.save();
    res.status(201).json(newDeveloper);
  } catch (error) { res.status(400).json({ message: 'Error adding developer', error }); }
});

app.put('/api/developers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, regNo, image } = req.body;
  try {
    const updatedDeveloper = await Developer.findByIdAndUpdate(id, { name, regNo, image }, { new: true });
    if (!updatedDeveloper) return res.status(404).json({ message: 'Developer not found' });
    res.json(updatedDeveloper);
  } catch (error) { res.status(400).json({ message: 'Error updating developer', error }); }
});

app.delete('/api/developers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deletedDeveloper = await Developer.findByIdAndDelete(id);
    if (!deletedDeveloper) return res.status(404).json({ message: 'Developer not found' });
    res.json({ message: 'Developer deleted successfully' });
  } catch (error) { res.status(500).json({ message: 'Error deleting developer', error }); }
});


// --- Public Internship Routes (Unprotected) ---
app.get('/public/internships', async (req, res) => {
  try {
    const internships = await Internship.find().sort({ createdAt: -1 });
    res.json(internships);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public internships', error });
  }
});

// --- Public Placement Routes (Unprotected) ---
app.get('/public/placements', async (req, res) => {
  try {
    const placements = await Placement.find().sort({ createdAt: -1 });
    res.json(placements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public placements', error });
  }
});

