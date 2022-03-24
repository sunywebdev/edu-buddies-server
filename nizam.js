module.exports = function (app) {
	const {
		initializeApp,
		applicationDefault,
		cert,
	} = require("firebase-admin/app");
	const {
		getFirestore,

		Timestamp,
		FieldValue,
		collection,
	} = require("firebase-admin/firestore");
	const express = require("express");
	const { MongoClient } = require("mongodb");
	const ObjectId = require("mongodb").ObjectId;
	require("dotenv").config();
	const cors = require("cors");

	app.use(cors());
	app.use(express.json());

	const user = process.env.DB_USER;
	const password = process.env.DB_PASS;

	const uri = `mongodb+srv://${user}:${password}@cluster0.tgh4y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	const serviceAccount = require("./edu.json");

	initializeApp({
		credential: cert(serviceAccount),
	});

	async function run() {
		try {
			await client.connect();
			console.log("Database Connected Succesfully on Nizam.js");
			const database = client.db("edubuddies");
			const courses = database.collection("courses");
			const userCollection = database.collection("users");
			const instructorCollection = database.collection("instuctor");
			const blogsCollection = database.collection("blogs");
			const newsletterCollection = database.collection("newsletter");
			const promoCollection = database.collection("promo");
			const logCollection = database.collection("log");
			const studentCollection = database.collection("student");
			const db = getFirestore();

			// const snapshot = await db.collection("history").get();
			// snapshot.forEach((doc) => {
			//   console.log(doc.id, "=>", doc.data());
			// });

			const doc = db.collection("history").doc("history");

			const observer = doc.onSnapshot(
				(docSnapshot) => {
					console.log(`Received doc snapshot: ${docSnapshot}`);
					// ...
				},
				(err) => {
					console.log(`Encountered error: ${err}`);
				},
			);

			const logFunc = async (req, res, next) => {
				console.log(req.message);
				let ipAdd;
				if (req.ip.length > 3) {
					ipAdd = req.ip.split("f:")[1];
				} else {
					ipAdd = req.ip;
				}
				const ress = await db
					.collection("history")
					.doc()
					.set({
						data: req.body,
						ipAddress: ipAdd,
						method: req.method,
						originalURL: req.originalUrl,
						hostName: req.hostname,
						path: req.path,
						params: req.params,
						now: Date.now(),
						timestamp: Timestamp.fromDate(new Date()),
						date: new Date().toLocaleDateString(),
						time: new Date().toLocaleTimeString(),
					});

				next();
			};

			// get all the course List Here....
			app.get("/courses", async (req, res) => {
				req.message = "Hello";
				const coursesList = courses.find({});
				const allCoursesList = await coursesList.toArray();
				res.send(allCoursesList);
			});

			// course update status
			app.patch("/courses/:id", logFunc, async (req, res) => {
				const status = req.body;
				const id = req.params.id;
				const filter = { _id: ObjectId(id) };
				const updateDoc = { $set: { courseStatus: status.statusName } };
				const result = await courses.updateOne(filter, updateDoc);
				res.json(result);
			});

			//POST API For Users
			app.post("/users", logFunc, async (req, res) => {
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

			// get user role by email
			app.get("/getUserRole/:email", async (req, res) => {
				const email = req.params.email;
				const cursor = userCollection.find({ email: email });
				const users = await cursor.toArray();
				res.json(users);
			});

			//Upsert
			app.put("/users", logFunc, async (req, res) => {
				const user = req.body;
				user.role = "user";
				const filter = { email: user.email };
				const options = { upsert: true };
				const updateDoc = { $set: user };
				const result = await userCollection.updateOne(
					filter,
					updateDoc,
					options,
				);
				res.json(result);
			});

			//Make Admin
			app.put("/users/admin", logFunc, async (req, res) => {
				const user = req.body;
				console.log("put", user);
				const filter = { email: user.email };
				const updateDoc = { $set: { role: "Admin" } };
				const result = await userCollection.updateOne(filter, updateDoc);
				res.json(result);
			});

			// insert Teacher Data
			app.post("/addTeacher", logFunc, async (req, res) => {
				const teacher = req.body;
				teacher.role = "Teacher";
				console.log(teacher);
				const result = await instructorCollection.insertOne(teacher);
				console.log(result);
				res.json(result);
			});

			// get all teacher from teachers DB
			app.get("/teachers", async (req, res) => {
				const cursor = instructorCollection.find({});
				const teachers = await cursor.toArray();
				res.json(teachers);
			});

			// DELETE Teacher from Teacher db

			app.delete("/deleteTeacher/:id", logFunc, async (req, res) => {
				const id = req.params.id;
				const query = { _id: ObjectId(id) };
				const result = await instructorCollection.deleteOne(query);
				console.log(result);
				res.json(result);
			});

			//Make Teacher
			app.put("/users/teacher", logFunc, async (req, res) => {
				const user = req.body;
				console.log("put", user);
				const filter = { email: user.email };
				const updateDoc = { $set: { role: "Teacher" } };
				const result = await userCollection.updateOne(filter, updateDoc);
				res.json(result);
			});

			// get all teacher list from user db  base on role
			app.get("/users/teachers", logFunc, async (req, res) => {
				const cursor = userCollection.find({ role: "Teacher" });
				const users = await cursor.toArray();
				res.json(users);
			});

			// update teacher status
			app.patch("/teacherStatus/:id", logFunc, async (req, res) => {
				const status = req.body;
				const id = req.params.id;
				console.log(id, status);
				const options = { upsert: true };
				const filter = { _id: ObjectId(id) };
				const updateDoc = { $set: { status: status.statusName } };
				const result = await instructorCollection.updateOne(
					filter,
					updateDoc,
					options,
				);
				res.json(result);
			});

			//Admin Verfication
			app.get("/users/:email", logFunc, async (req, res) => {
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

			app.post("/addCourse", logFunc, async (req, res) => {
				console.log(req.body);
				const newItem = req.body;
				const result = await courses.insertOne(newItem);
				res.json(result);
			});

			// update video contents

			app.put("/updateCourseContent/:id", logFunc, async (req, res) => {
				const id = req.params.id;
				const CourseData = req.body;
				console.log(id);
				console.log(CourseData);
				const filter = { _id: ObjectId(id) };
				const options = { upsert: true };
				const fiterData = await courses.findOne(filter);
				fiterData.data.push(CourseData);
				const updateDoc = { $set: { data: fiterData.data } };
				const result = await courses.updateOne(filter, updateDoc, options);
				res.json(result);
			});

			// delete a course
			app.delete("/deleteCourses/:id", logFunc, async (req, res) => {
				const id = req.params.id;
				const query = { _id: ObjectId(id) };
				const result = await courses.deleteOne(query);
				console.log(result);
				res.json(result);
			});

			// get course using email
			app.get("/getCourse/:email", logFunc, async (req, res) => {
				const email = req.params.email;
				const cursor = courses.find({ "owner.email": email });
				const users = await cursor.toArray();
				res.json(users);
			});

			// add   my courese of Student DB

			app.put("/addMyCourses/:email", logFunc, async (req, res) => {
				// change role
				const email = req.params.email;
				const userData = req.body.userData;
				const courseData = req.body.courseInfo;
				const options = { upsert: true };

				const filter = { email: email };
				const fiterData = await studentCollection.findOne(filter);

				if (fiterData === null) {
					const updateData = {
						$set: {
							email: email,
							role: "Student",
							displayName: userData?.displayName,
							photoURL: userData?.photoURL,
							myCourse: [courseData],
							skillset: [],
							language: [],
						},
					};

					await userCollection.updateOne(
						filter,
						{
							$set: {
								role: "Student",
							},
						},
						options,
					);
					const result = await studentCollection.updateOne(
						filter,
						updateData,
						options,
					);
					res.json(result);
				} else if (fiterData) {
					fiterData.myCourse.push(courseData);
					const updateData = {
						$set: {
							myCourse: fiterData.myCourse,
						},
					};
					const result = await studentCollection.updateOne(
						filter,
						updateData,
						options,
					);
					res.json(result);
				}

				//
				//       const data = req.body;
				//       console.log("put", user);

				//       console.log(fiterData);
				//       fiterData.myCourse.push(data);
				//       const updateDoc = { $set: { myCourse: fiterData } };
				//       const result = await studentCollection.updateOne(filter, updateDoc);
				// res.json(fiterData);
			});

			/*-------------------------------------------------------------------------------*\
  ////////////////////// Filtering Courses By Categories \\\\\\\\\\\\\\\\\\\\\\\\\
\*-------------------------------------------------------------------------------*/

			// Game Courses
			app.get("/GameDevCourses", async (req, res) => {
				let query = {};
				const gameCategory = req.query.particularCategory;

				if (gameCategory) {
					query = { category: gameCategory };
				}
				const cursor = courses.find(query);
				const gameCourses = await cursor.toArray();
				res.json(gameCourses);
				// console.log();
			});

			// Programming Courses
			app.get("/ProgrammingCourses", async (req, res) => {
				let query = {};
				const programCategory = req.query.particularCategory;

				if (programCategory) {
					query = { category: programCategory };
				}
				const cursor = courses.find(query);
				const programmingCourses = await cursor.toArray();
				res.json(programmingCourses);
				// console.log();
			});

			// Web Courses
			app.get("/WebDevCourses", async (req, res) => {
				let query = {};
				const webCategory = req.query.particularCategory;

				if (webCategory) {
					query = { category: webCategory };
				}
				const cursor = courses.find(query);
				const webCourses = await cursor.toArray();
				res.json(webCourses);
				// console.log();
			});

			/*-------------------------------------------------------------------------------*\
  ////////////////////// Filtering Courses By Categories \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
\*-------------------------------------------------------------------------------*/
		} finally {
		}
	}
	run().catch(console.dir);
};
