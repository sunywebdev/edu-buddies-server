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
			console.log("Database Connected Succesfully on Ashraful.js");
			const database = client.db("edubuddies");
			const courses = database.collection("courses");
			const userCollection = database.collection("users");
			const teachersCollection = database.collection("teachers");
			const allUsersCollection = database.collection("allUsers");
			const blogsCollection = database.collection("blogs");
			const newsletterCollection = database.collection("newsletter");
			const promoCollection = database.collection("promo");

			// get Single Teacher Info From DB
			app.get("/singleTeacher/:id", async (req, res) => {
				const id = req.params.id;
				const query = { _id: ObjectId(id) };
				const TeacherData = await teachersCollection.findOne(query);
				res.json(TeacherData);
			});

			// get My Course Info From DB
			app.get("/CourseDetails/:courseId", async (req, res) => {
				const id = req.params.courseId;
				const query = { _id: ObjectId(id) };
				const CourseData = await courses.findOne(query);
				res.json(CourseData);
			});

			// get Best Perfomer from Teacher
			app.get("/teachersDashboard/bestPerformer", async (req, res) => {
				const bestPerformer = req.query;
				const TeacherData = await teachersCollection
					.find({
						performer: bestPerformer.performer,
					})
					.toArray();
				res.json(TeacherData);
			});
		} finally {
		}
	}
	run().catch(console.dir);
};
