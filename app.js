const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = 5000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

mongoose.connect('mongodb://127.0.0.1:27017/semsdatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const courseSchema = new mongoose.Schema({
  courseId: { type: String, unique: true },
  courseName: { type: String, unique: true },
});

const semesterSchema = new mongoose.Schema({
  semesterId: { type: Number, unique: true },
  courses: [courseSchema],
});

const Semester = mongoose.model('Semester', semesterSchema);
const Course = mongoose.model('Course', courseSchema);

const getNextCourseId = async () => {
  try {
    const latestCourse = await Course.findOne().sort({ courseId: -1 });
    const latestCourseId = latestCourse ? parseInt(latestCourse.courseId.split('_')[1]) : 0;
    return latestCourseId + 1;
  } catch (error) {
    console.error('Error getting next courseId:', error);
    throw error;
  }
};

app.get('/sem', async (req, res) => {
  try {
    const semesters = await Semester.find();
    res.render('index.ejs', { semesters: semesters });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/addCourse', async (req, res) => {
  try {
    const { courseName } = req.body;

    const nextCourseId = await getNextCourseId();

    const newCourse = new Course({
      courseId: `COURSE_${nextCourseId}`,
      courseName: courseName,
    });

    const savedCourse = await newCourse.save();
    console.log('Course saved:', savedCourse);

    const latestSemester = await Semester.findOne().sort({ semesterId: -1 });
    if (!latestSemester) {
      const newSemester = new Semester({
        semesterId: 1,
        courses: [newCourse],
      });

      const savedSemester = await newSemester.save();
      console.log('Semester saved:', savedSemester);
    } else {
      latestSemester.courses.push(newCourse);
      await latestSemester.save();
      console.log('Course added to the latest semester:', latestSemester);
    }

    res.redirect('/sem');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const data = await User.findOne({
    username: username,
    password: password,
  });

  if (data) {
    req.session.user = username;
    res.status(200).sendFile(path.join(__dirname, 'subui.html'));
  } else {
    res.status(401).send('Invalid username or password');
  }
});

app.get('/login', (req, res) => {
  const filePath = path.join(__dirname, 'login.html');
  res.sendFile(filePath);
});

app.get('/subjects', (req, res) => {
  const filePath = path.join(__dirname, 'subjects.html');
  res.sendFile(filePath);
});

// Another set of login routes
app.post('/login1', async (req, res) => {
  const { username, password } = req.body;
  const data = await User.findOne({
    username: username,
    password: password,
  });

  if (data) {
    req.session.user = username;
    res.status(200).sendFile(path.join(__dirname, 'user.html'));
  } else {
    res.status(401).send('Invalid username or password');
  }
});

app.get('/pro2', (req, res) => {
  const filePath = path.join(__dirname, 'pro2.html');
  res.sendFile(filePath);
});

app.get('/login1', (req, res) => {
  const filePath = path.join(__dirname, 'login1.html');
  res.sendFile(filePath);
});

// Serve HTML form with data loaded from MongoDB
app.get('/pro2', async (req, res) => {
  try {
    // Fetch data from MongoDB
    const dataFromDB = await DataTable.find({});

    // Log the fetched data for debugging
    console.log('Fetched Data:', dataFromDB);

    // Render the HTML form with data
    res.render('form', { data: dataFromDB });
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Other routes...

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
