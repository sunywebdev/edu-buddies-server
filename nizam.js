module.exports = function (app) {
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

	async function run() {
		try {
			await client.connect();
			console.log("Database Connected Succesfully on Nizam.js");
			const database = client.db("edubuddies");
			const courses = database.collection("courses");
			const userCollection = database.collection("users");
			const teachersCollection = database.collection("teachers");
			const allUsersCollection = database.collection("allUsers");
			const blogsCollection = database.collection("blogs");
			const newsletterCollection = database.collection("newsletter");
            const promoCollection = database.collection("promo");
            
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
				const result = await userCollection.updateOne(
					filter,
					updateDoc,
					options,
				);
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

			// update teacher status
			app.patch("/teacherStatus/:id", async (req, res) => {
				const status = req.body;
				const id = req.params.id;
				console.log(id, status);
				const options = { upsert: true };
				const filter = { _id: ObjectId(id) };
				const updateDoc = { $set: { status: status.statusName } };
				const result = await teachersCollection.updateOne(
					filter,
					updateDoc,
					options,
				);
				res.json(result);
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

			app.put("/updateCourseContent/:id", async (req, res) => {
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
			app.delete("/deleteCourses/:id", async (req, res) => {
				const id = req.params.id;
				const query = { _id: ObjectId(id) };
				const result = await courses.deleteOne(query);
				console.log(result);
				res.json(result);
			});

			// get course using email
			app.get("/getCourse/:email", async (req, res) => {
				const email = req.params.email;
				const cursor = courses.find({ "owner.email": email });
				const users = await cursor.toArray();
				res.json(users);
			});
		} finally {
		}
	}
	run().catch(console.dir);
};
