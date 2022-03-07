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

	async function run() {
		try {
			await client.connect();
			console.log("Database Connected Succesfully on Suny.js");
			const database = client.db("edubuddies");
			const courses = database.collection("courses");
			const userCollection = database.collection("users");
			const teachersCollection = database.collection("teachers");
			const allUsersCollection = database.collection("allUsers");
			const blogsCollection = database.collection("blogs");
			const newsletterCollection = database.collection("newsletter");
			const promoCollection = database.collection("promo");

			//Change role
			app.put("/changerole", async (req, res) => {
				const user = req.body;
				console.log("user", user);
				const filter = { email: user.email };
				const updateDoc = { $set: { role: user.role } };
				const result = await allUsersCollection.updateOne(filter, updateDoc);
				res.json(result);
			});

			///post new promo
			app.post("/promo", async (req, res) => {
				const newItem = req.body;
				console.log("Request from UI ", newItem);
				const result = await promoCollection.insertOne(newItem);
				console.log("Successfully Added New promo ", result);
				res.json(result);
			});
			//To load promo
			app.get("/promo", async (req, res) => {
				const cursor = promoCollection.find({});
				const result = await cursor.toArray();
				console.log("Found one", result);
				res.json(result);
			});

			//To Delete promo one by one
			app.delete("/promo/:id", async (req, res) => {
				const id = req.params.id;
				console.log("Request to delete ", id);
				const deleteId = { _id: ObjectId(id) };
				const result = await promoCollection.deleteOne(deleteId);
				res.send(result);
				console.log("promo code Successfully Deleted", result);
			});
			// To update promo status
			app.put("/promo/:id", async (req, res) => {
				const id = req.params.id;
				console.log("id", id);
				const updatedReq = req.body;
				console.log(updatedReq);
				const filter = { _id: ObjectId(id) };
				const updateDoc = { $set: { status: updatedReq.text } };
				const result = await promoCollection.updateOne(filter, updateDoc);
				res.json(result);
			});

			///post new blog
			app.post("/blogs", async (req, res) => {
				const newItem = req.body;
				console.log("Request from UI ", newItem);
				const result = await blogsCollection.insertOne(newItem);
				console.log("Successfully Added New Blog ", result);
				res.json(result);
			});

			///post newsletter
			app.post("/newsletter", async (req, res) => {
				const newItem = req.body;
				console.log("Request from UI ", newItem);
				const result = await newsletterCollection.insertOne(newItem);
				console.log("Successfully Added New newsletter ", result);
				res.json(result);
			});

			//To Delete newsletter one by one
			app.delete("/newsletter/:id", async (req, res) => {
				const id = req.params.id;
				console.log("Request to delete ", id);
				const deleteId = { _id: ObjectId(id) };
				const result = await newsletterCollection.deleteOne(deleteId);
				res.send(result);
				console.log("newsletter Successfully Deleted", result);
			});

			//To load newsletter
			app.get("/newsletter", async (req, res) => {
				const cursor = newsletterCollection.find({});
				const result = await cursor.toArray();
				console.log("Found one", result);
				res.json(result);
			});

			// To update newsletter status
			app.put("/newsletterStatus/:id", async (req, res) => {
				const id = req.params.id;
				console.log("id", id);
				const updatedReq = req.body;
				console.log(updatedReq);
				const filter = { _id: ObjectId(id) };
				const updateDoc = { $set: { status: updatedReq.text } };
				const result = await newsletterCollection.updateOne(filter, updateDoc);
				res.json(result);
			});

			//to send newsletter
			app.post("/postnewsletter", async (req, res) => {
				let allUsers = await newsletterCollection.find().toArray();
				console.log(allUsers);
				const stdEmailList = allUsers?.map((user) => user?.email).join(",");
				console.log("stdEmailList", stdEmailList);
				const incomming = req.body;
				console.log("incomming", incomming);
				const mailOptions = {
					from: "EDU-BUDDIES NEWSLETTER <suny7610@gmail.com>",
					to: stdEmailList,
					subject: incomming?.subject,
					html: incomming?.details,
				};
				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
						res.json(error);
					} else {
						console.log("Newsletter sent: " + info.response);
						res.json(info);
					}
				});
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

			//To load all profile data
			app.get("/allusersdata", async (req, res) => {
				const cursor = allUsersCollection.find({});
				const result = await cursor.toArray();
				console.log("Found one", result);
				res.json(result);
			});
		} finally {
		}
	}
	run().catch(console.dir);
};
