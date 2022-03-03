const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const path = require("path");
const cors = require("cors");
const Youtube = require("youtube-api");
const uuid = require("uuid");
const multer = require("multer");
// const upload = multer({ dest: "./uploads" });
const open = require("open");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 5000;

const credentials = require("./credentials.json");

app.use(cors());
app.use(express.json());

const oauth = Youtube.authenticate({
	type: "oauth",
	client_id: credentials.web.client_id,
	client_secret: credentials.web.client_secret,
	redirect_url: credentials.web.redirect_uris[0],
});

const user = process.env.DB_USER;
const password = process.env.DB_PASS;

const uri = `mongodb+srv://${user}:${password}@cluster0.tgh4y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const storage = multer.diskStorage({
	destination: "./uploads",

	filename(req, file, cb) {
		const newFileName = `${file.originalname}`;
		cb(null, newFileName);
	},
});

const uploadVideoFile = multer({
	storage: storage,
}).single("file");

///////////////////////////////////////////////////////////////////////////////////////////////////
let cron = require("node-cron");
const nodemailer = require("nodemailer");

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: emailUser,
		pass: emailPassword,
	},
});
///////////////////////////////////////////////////////////////////////////////////////////////////

async function run() {
	try {
		await client.connect();
		console.log("Database Connected Succesfully");
		const database = client.db("edubuddies");
		const courses = database.collection("courses");
		const userCollection = database.collection("users");
		const teachersCollection = database.collection("teachers");
		const allUsersCollection = database.collection("allUsers");
		const blogsCollection = database.collection("blogs");

		// get all the course List Here....

		app.get("/courses", async (req, res) => {
			const coursesList = courses.find({});
			const allCoursesList = await coursesList.toArray();
			res.send(allCoursesList);
		});

		// course update status
		app.patch("/courses/:id", async (req, res) => {
			const status = req.body;
			const id = req.params.id;
			const filter = { _id: ObjectId(id) };
			const updateDoc = { $set: { courseStatus: status.statusName } };
			const result = await courses.updateOne(filter, updateDoc);
			res.json(result);
		});

		/*-------------------------------------------------------------------------------*\
  //////////////////////////////// Users \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
\*-------------------------------------------------------------------------------*/

		//POST API For Users
		app.post("/users", async (req, res) => {
			const user = req.body;
			user.role = "user";
			console.log(user);
			const result = await userCollection.insertOne(user);
			console.log(result);
			res.json(result);
		});

		//Get Users API
		app.get("/users", async (req, res) => {
			const cursor = userCollection.find({});
			const users = await cursor.toArray();
			res.json(users);
		});

		//Upsert
		app.put("/users", async (req, res) => {
			const user = req.body;
			user.role = "user";
			const filter = { email: user.email };
			const options = { upsert: true };
			const updateDoc = { $set: user };
			const result = await userCollection.updateOne(filter, updateDoc, options);
			res.json(result);
		});

		//Make Admin
		app.put("/users/admin", async (req, res) => {
			const user = req.body;
			console.log("put", user);
			const filter = { email: user.email };
			const updateDoc = { $set: { role: "Admin" } };
			const result = await userCollection.updateOne(filter, updateDoc);
			res.json(result);
		});

		// insert Teacher Data
		app.post("/addTeacher", async (req, res) => {
			const teacher = req.body;
			teacher.role = "Teacher";
			console.log(teacher);
			const result = await teachersCollection.insertOne(teacher);
			console.log(result);
			res.json(result);
		});

		// get all teacher from teachers DB
		app.get("/teachers", async (req, res) => {
			const cursor = teachersCollection.find({});
			const teachers = await cursor.toArray();
			res.json(teachers);
		});

		// DELETE Teacher from Teacher db

		app.delete("/deleteTeacher/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await teachersCollection.deleteOne(query);
			console.log(result);
			res.json(result);
		});

		//Make Teacher
		app.put("/users/teacher", async (req, res) => {
			const user = req.body;
			console.log("put", user);
			const filter = { email: user.email };
			const updateDoc = { $set: { role: "Teacher" } };
			const result = await userCollection.updateOne(filter, updateDoc);
			res.json(result);
		});

		// get all teacher list from user db  base on role
		app.get("/users/teachers", async (req, res) => {
			const cursor = userCollection.find({ role: "Teacher" });
			const users = await cursor.toArray();
			res.json(users);
		});

		//Admin Verfication
		app.get("/users/:email", async (req, res) => {
			const email = req.params.email;
			const query = { email: email };
			const user = await userCollection.findOne(query);
			let isAdmin = false;
			if (user?.role === "Admin") {
				isAdmin = true;
			}
			res.json({ admin: isAdmin });
		});

		// Add a new courses

		app.post("/addCourse", async (req, res) => {
			console.log(req.body);
			const newItem = req.body;
			const result = await courses.insertOne(newItem);
			res.json(result);
		});

		// update video contents

		app.patch("/updateCourseContent/:id", async (req, res) => {
			const id = req.params.id;
			const CourseData = req.body;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };

			const fiterData = await courses.findOne(filter);
			const dataa = fiterData.data;
			const arrayLength = dataa.length;
			CourseData.milestone = `milestone ${arrayLength}`;
			fiterData.data.push(CourseData);
			const updateDoc = { $set: { data: fiterData.data } };
			const result = await courses.updateOne(filter, updateDoc);
			res.json(result);
		});

		// delete a course
		app.delete("/deleteCourses/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await courses.deleteOne(query);
			console.log(result);
			res.json(result);
		});

		///////////////////////////////////////////////////

		/// from Shoyeb Mohammed Suny ////

		////////////////////////////////////////////////

		app.post("/blogs", async (req, res) => {
			const newItem = req.body;
			console.log("Request from UI ", newItem);
			const result = await blogsCollection.insertOne(newItem);
			console.log("Successfully Added New Blog ", result);
			res.json(result);
		});

		//To Delete blog one by one
		app.delete("/blogs/:id", async (req, res) => {
			const id = req.params.id;
			console.log("Request to delete ", id);
			const deleteId = { _id: ObjectId(id) };
			const result = await blogsCollection.deleteOne(deleteId);
			res.send(result);
			console.log("blog Successfully Deleted", result);
		});

		//To load blogs
		app.get("/blogs", async (req, res) => {
			const cursor = blogsCollection.find({});
			const result = await cursor.toArray();
			console.log("Found one", result);
			res.json(result);
		});

		//To load single blog by id
		app.get("/blogs/:id", async (req, res) => {
			const id = req.params.id;
			console.log("Request to find ", id);
			const findId = { _id: ObjectId(id) };
			const result = await blogsCollection.findOne(findId);
			res.send(result);
			console.log("Found one", result);
		});

		// To update single review data
		app.put("/review/:id", async (req, res) => {
			const id = req.params.id;
			console.log("id", id);
			const filter = { _id: ObjectId(id) };
			const updatedReq = req.body;
			console.log("updatedReq", updatedReq);
			const options = { upsert: true };
			const fiterData = await blogsCollection.findOne(filter);
			console.log("fiterData", fiterData);
			fiterData.reviews.push(updatedReq);
			const updateFile = {
				$set: {
					reviews: fiterData.reviews,
				},
			};
			const result = await blogsCollection.updateOne(
				filter,
				updateFile,
				options,
			);
			res.json(result);
		});

		// To update blog status
		app.put("/blogStatus/:id", async (req, res) => {
			const id = req.params.id;
			console.log("id", id);
			const updatedReq = req.body;
			console.log(updatedReq);
			const filter = { _id: ObjectId(id) };
			const updateDoc = { $set: { blogStatus: updatedReq.text } };
			const result = await blogsCollection.updateOne(filter, updateDoc);
			res.json(result);
		});

		//To add new user when login or signup
		app.post("/signup", async (req, res) => {
			const newuser = req.body;
			console.log("Request from UI ", newuser);
			const result = await allUsersCollection.insertOne(newuser);
			console.log("Successfully Added New User ", result);
			res.json(result);
		});
		//To update or replace users data when login or signup
		app.put("/login", async (req, res) => {
			console.log(req.body);
			const user = req.body;
			const filter = { email: user?.email };
			console.log("Request to replace or add user", user);
			const options = { upsert: true };
			const updateuser = {
				$set: {
					email: user?.email,
					displayName: user?.displayName,
					photoURL: user?.photoURL,
				},
			};
			const result = await allUsersCollection.updateOne(
				filter,
				updateuser,
				options,
			);
			res.json(result);
			console.log("Successfully replaced or added user", result);
		});

		//to send message automatically
		app.post("/autoEmail", async (req, res) => {
			let allUsers = await allUsersCollection.find().toArray();
			console.log(allUsers);
			const stdEmailList = allUsers?.map((user) => user?.email).join(",");
			console.log(stdEmailList);
			const incomming = req.body;
			console.log("incomming", incomming);
			const mailOptions = {
				from: "EDU-BUDDIES <suny7610@gmail.com>",
				to: stdEmailList,
				cc: incomming?.cc,
				bcc: incomming?.bcc,
				subject: incomming?.subject,
				html: incomming?.email,
			};
			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
					res.json(error);
				} else {
					console.log("Email sent: " + info.response);
					res.json(info);
				}
			});
		});

		// To update single profile status data
		app.put("/profile", async (req, res) => {
			const user = req.query;
			const filter = { email: user?.email };
			const updatedReq = req.body;
			console.log("Comming form UI", updatedReq);
			const options = { upsert: true };
			const fiterData = await allUsersCollection.findOne(filter);
			const data = fiterData?.skillset;
			const updateFile = {
				$set: {
					fullname: updatedReq.fullname,
					phone: updatedReq.phone,
					email: updatedReq.email,
					about: updatedReq.about,
					photoURL: updatedReq.photoURL,
					skillset: data,
				},
			};
			const result = await allUsersCollection.updateOne(
				filter,
				updateFile,
				options,
			);
			res.json(result);
			console.log("Updated Successfully", result);
		});

		// To update single profile links data
		app.put("/importantlinks", async (req, res) => {
			const user = req.query;
			const filter = { email: user?.email };
			const updatedReq = req.body;
			console.log("Comming form UI", updatedReq);
			const options = { upsert: true };
			const updateFile = {
				$set: {
					importantlinks: {
						cvLink: updatedReq.cvLink,
						githubLink: updatedReq.githubLink,
						portfolio: updatedReq.portfolio,
						linkedinProfile: updatedReq.linkedinProfile,
					},
				},
			};
			const result = await allUsersCollection.updateOne(
				filter,
				updateFile,
				options,
			);
			res.json(result);
			console.log("Updated Successfully", result);
		});

		// To update single profile education data
		app.put("/education", async (req, res) => {
			const user = req.query;
			const filter = { email: user?.email };
			const updatedReq = req.body;
			console.log("Comming form UI", updatedReq);
			const options = { upsert: true };
			const updateFile = {
				$set: {
					educationalExp: {
						educationalLevel: updatedReq.educationalLevel,
						degree: updatedReq.degree,
						instituteName: updatedReq.instituteName,
						passingYear: updatedReq.passingYear,
						currentYear: updatedReq.currentYear,
						grade: updatedReq.grade,
					},
				},
			};
			const result = await allUsersCollection.updateOne(
				filter,
				updateFile,
				options,
			);
			res.json(result);
			console.log("Updated Successfully", result);
		});

		// To update single profile present address data
		app.put("/presentaddress", async (req, res) => {
			const user = req.query;
			const filter = { email: user?.email };
			const updatedReq = req.body;
			console.log("Comming form UI", updatedReq);
			const options = { upsert: true };
			const updateFile = {
				$set: {
					presentAddress: {
						addressLine1: updatedReq.addressLine1,
						addressLine2: updatedReq.addressLine2,
						city: updatedReq.city,
						state: updatedReq.state,
						phone: updatedReq.phone,
						zip: updatedReq.zip,
						country: updatedReq.country,
					},
				},
			};
			const result = await allUsersCollection.updateOne(
				filter,
				updateFile,
				options,
			);
			res.json(result);
			console.log("Updated Successfully", result);
		});

		// To update single profile permanent address data
		app.put("/permanentaddress", async (req, res) => {
			const user = req.query;
			const filter = { email: user?.email };
			const updatedReq = req.body;
			console.log("Comming form UI", updatedReq);
			const options = { upsert: true };
			const updateFile = {
				$set: {
					permanentAddress: {
						addressLine1: updatedReq.addressLine1,
						addressLine2: updatedReq.addressLine2,
						city: updatedReq.city,
						state: updatedReq.state,
						phone: updatedReq.phone,
						zip: updatedReq.zip,
						country: updatedReq.country,
					},
				},
			};
			const result = await allUsersCollection.updateOne(
				filter,
				updateFile,
				options,
			);
			res.json(result);
			console.log("Updated Successfully", result);
		});

		//// problem , need to fix/////

		// To update single profile skillset data
		app.put("/skillset", async (req, res) => {
			const user = req.query;
			const filter = { email: user?.email };
			const updatedReq = req.body;
			const options = { upsert: true };
			const fiterData = await allUsersCollection.findOne(filter);
			fiterData.skillset.push(updatedReq);
			const updateFile = {
				$set: {
					skillset: fiterData.skillset,
				},
			};
			const result = await allUsersCollection.updateOne(
				filter,
				updateFile,
				options,
			);
			res.json(result);
		});

		// To update single profile skillset data
		app.put("/skillsetDelete/:email/:skill", async (req, res) => {
			const incoming = req.params;
			console.log("email:", incoming?.email);
			console.log("skill:", incoming?.skill);
			const filter = { email: incoming?.email };
			const fiterData = await allUsersCollection.findOne(filter);
			const data = fiterData.skillset;
			let filteredArray = data.filter(
				(value) => value.skill !== incoming?.skill,
			);
			console.log("filteredArray", filteredArray);

			const updateFile = {
				$set: {
					skillset: filteredArray,
				},
			};
			const result = await allUsersCollection.updateOne(filter, updateFile);
			res.json(result);
		});

		//To load single profile data
		app.get("/allusers", async (req, res) => {
			const user = req.query;
			console.log("user", user);
			const result = await allUsersCollection.findOne({ email: user?.email });
			res.send(result);
			console.log("Found one", result);
		});
		//end of the code
	} finally {
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("EDU BUDDIES is Running");
});

app.listen(port, () => {
	console.log("EDU BUDDIES Server is running at port", port);
});
