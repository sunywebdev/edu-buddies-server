module.exports = function (app) {
	const express = require("express");
	const { MongoClient, ConnectionPoolMonitoringEvent } = require("mongodb");
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
			const blogsCollection = database.collection("blogs");
			const newsletterCollection = database.collection("newsletter");
			const promoCollection = database.collection("promo");
			const SupportSessionCollection = database.collection("supportsession");
			const studentCollection = database.collection("student");
			const instructorCollection = database.collection("instuctor");
			const adminCollection = database.collection("admin");
			const emailCollection = database.collection("email");

			//Change role
			app.put("/changerole", async (req, res) => {
				const options = { upsert: true };

				const user = req.body;
				const filter = { email: user.email };
				const updateData = {
					$set: {
						email: user.email,
						role: user.role,
						displayName: user.displayName,
						photoURL: user.photoURL,
						myCourse: [],
						skillset: [],
						language: [],
					},
				};

				//   also change user role in user Table
				const univeresalRole = async () => {
					const result = await userCollection.updateOne(
						filter,
						updateData,
						options,
					);
				};
				// delete from admin databese
				const deleteFromAdmin = async () => {
					const result = await adminCollection.deleteOne(filter);
					console.log(result);
				};
				// delete from Instrcutor databese
				const deleteFromInstructor = async () => {
					const result = await instructorCollection.deleteOne(filter);
					console.log(result);
				};
				// delete from Student databese
				const deleteFromStudent = async () => {
					const result = await studentCollection.deleteOne(filter);
					console.log(result);
				};

				console.log("user", user);
				if (user.role === "Admin") {
					const result = await adminCollection.updateOne(
						filter,
						updateData,
						options,
					);
					univeresalRole();
					deleteFromStudent();
					deleteFromInstructor();
					res.json(result);
				} else if (user.role === "Instructor") {
					const result = await instructorCollection.updateOne(
						filter,
						updateData,
						options,
					);

					univeresalRole();
					deleteFromAdmin();
					deleteFromStudent();
					res.json(result);
				} else if (user.role === "Student") {
					const result = await studentCollection.updateOne(
						filter,
						updateData,
						options,
					);
					univeresalRole();
					deleteFromAdmin();
					deleteFromInstructor();
					res.json(result);
				} else {
					const result = await userCollection.updateOne(
						filter,
						updateData,
						options,
					);
					deleteFromAdmin();
					deleteFromStudent();
					deleteFromInstructor();
					res.json(result);
				}
			});

			///post new email
			app.post("/email", async (req, res) => {
				const newItem = req.body;
				console.log("Request from UI ", newItem);
				const email = newItem?.email;
				const userName = newItem?.userName;
				const message = newItem?.message;
				const subject = newItem?.subject;
				const mailOptions = {
					from: "EDU-BUDDIES EMAIL <suny7610@gmail.com>",
					to: "suny7610@gmail.com",
					subject: newItem?.subject,
					html: `
					<h3>From : </h3><span>${email}</span>
					<h3>Name : </h3><span>${userName}</span>
					<h3>Subject : </h3><span>${subject}</span>
					<h3>Message : </h3><span>${message}</span>`,
				};
				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
						res.json(error);
					} else {
						console.log("Enail sent: " + info.response);
						res.json(info);
					}
				});
				const result = await emailCollection.insertOne(newItem);
				console.log("Successfully Added New email ", result);
				res.json(result);
			});
			//To load email
			app.get("/email", async (req, res) => {
				const cursor = emailCollection.find({});
				const result = await cursor.toArray();
				console.log("Found one", result);
				res.json(result);
			});

			//To Delete email one by one
			app.delete("/email/:id", async (req, res) => {
				const id = req.params.id;
				console.log("Request to delete ", id);
				const deleteId = { _id: ObjectId(id) };
				const result = await emailCollection.deleteOne(deleteId);
				res.send(result);
				console.log("email Successfully Deleted", result);
			});

			//////////////////////////////////////////////////////////////////
			//////////////////////////////////////////////////////////////////
			///post new supportsession
			app.post("/supportsession", async (req, res) => {
				const newItem = req.body;
				console.log("Request from UI ", newItem);
				const result = await SupportSessionCollection.insertOne(newItem);
				console.log("Successfully Added New supportsession ", result);
				res.json(result);
			});
			//To load supportsession
			app.get("/supportsession", async (req, res) => {
				const cursor = SupportSessionCollection.find({});
				const result = await cursor.toArray();
				console.log("Found one", result);
				res.json(result);
			});

			//To Delete supportsession one by one
			app.delete("/supportsession/:id", async (req, res) => {
				const id = req.params.id;
				console.log("Request to delete ", id);
				const deleteId = { _id: ObjectId(id) };
				const result = await SupportSessionCollection.deleteOne(deleteId);
				res.send(result);
				console.log("supportsession code Successfully Deleted", result);
			});
			// To update supportsession join
			app.put("/joinsupportsession/:id", async (req, res) => {
				const id = req.params.id;
				console.log("id", id);
				const filter = { _id: ObjectId(id) };
				const updatedReq = req.body;
				console.log("updatedReq", updatedReq);
				const options = { upsert: true };
				const fiterData = await SupportSessionCollection.findOne(filter);
				console.log("fiterData", fiterData);
				fiterData.needSupport.push(updatedReq);
				const updateFile = {
					$set: {
						needSupport: fiterData.needSupport,
					},
				};
				const result = await SupportSessionCollection.updateOne(
					filter,
					updateFile,
					options,
				);
				res.json(result);
			});

			//To load supportsession by id
			app.get("/singlesupportsession/:id", async (req, res) => {
				const id = req.params.id;
				console.log("Request to find ", id);
				const findId = { _id: ObjectId(id) };
				const result = await SupportSessionCollection.findOne(findId);
				res.send(result);
				console.log("Found one", result);
			});
			// To update supportsession status
			app.put("/supportsession/:id", async (req, res) => {
				const id = req.params.id;
				console.log("id", id);
				const updatedReq = req.body;
				console.log(updatedReq);
				const filter = { _id: ObjectId(id) };
				const updateDoc = { $set: { status: updatedReq.text } };
				const result = await SupportSessionCollection.updateOne(
					filter,
					updateDoc,
				);
				res.json(result);
			});

			// To update singlesupportsession status
			app.put("/singlesupportsessionstatus/:id", async (req, res) => {
				const id = req.params.id;
				console.log("id", id);
				const filter = { _id: ObjectId(id) };
				const updatedReq = req.body.data;
				console.log("updatedReq", updatedReq);
				const fiterData = await SupportSessionCollection.findOne(filter);
				const data = fiterData.needSupport;
				console.log("fiterData", fiterData);
				console.log("data", data);
				console.log("updatedReq?.email", updatedReq?.email);
				console.log("updatedReq?.status", updatedReq?.status);
				const replaced = data?.map((x) =>
					x.supportId === updatedReq?.supportId ? updatedReq : x,
				);

				console.log("replace", replaced);
				const updateDoc = { $set: { needSupport: replaced } };
				const result = await SupportSessionCollection.updateOne(
					filter,
					updateDoc,
				);
				res.json(result);
			});
			//////////////////////////////////////////////////////////////////
			//////////////////////////////////////////////////////////////////

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

			//To load courses blog by id
			app.get("/courses/:id", async (req, res) => {
				const id = req.params.id;
				console.log("Request to find ", id);
				const findId = { _id: ObjectId(id) };
				const result = await courses.findOne(findId);
				res.send(result);
				console.log("Found one", result);
			});

			// To update single course Review data
			app.put("/courseReview/:id", async (req, res) => {
				const id = req.params.id;
				console.log("id", id);
				const filter = { _id: ObjectId(id) };
				const updatedReq = req.body;
				console.log("updatedReq", updatedReq);
				const options = { upsert: true };
				const fiterData = await courses.findOne(filter);
				console.log("fiterData", fiterData);
				fiterData.reviews.push(updatedReq);
				const updateFile = {
					$set: {
						reviews: fiterData.reviews,
					},
				};
				const result = await courses.updateOne(filter, updateFile, options);
				res.json(result);
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
				newuser.role = "User";
				console.log("Request from UI ", newuser);
				const result = await userCollection.insertOne(newuser);
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
				const result = await userCollection.updateOne(
					filter,
					updateuser,
					options,
				);
				res.json(result);
				console.log("Successfully replaced or added user", result);
			});

			//to send message automatically
			app.post("/autoEmail", async (req, res) => {
				let allUsers = await userCollection.find().toArray();
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
				const fiterData = await studentCollection.findOne(filter);
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
				const result = await studentCollection.updateOne(
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
				const result = await studentCollection.updateOne(
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
				const result = await studentCollection.updateOne(
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
				const result = await studentCollection.updateOne(
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
				const result = await studentCollection.updateOne(
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
				const fiterData = await studentCollection.findOne(filter);
				fiterData.skillset.push(updatedReq);
				const updateFile = {
					$set: {
						skillset: fiterData.skillset,
					},
				};
				const result = await studentCollection.updateOne(
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
				const fiterData = await studentCollection.findOne(filter);
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
				const result = await studentCollection.updateOne(filter, updateFile);
				res.json(result);
			});

			//To load single profile data
			app.get("/allusers", async (req, res) => {
				const user = req.query;
				console.log("user", user);
				const result = await studentCollection.findOne({ email: user?.email });
				res.send(result);
				console.log("Found one", result);
			});

			//To load all profile data
			app.get("/allusersdata", async (req, res) => {
				const cursor = userCollection.find({});
				const result = await cursor.toArray();
				console.log("Found one", result);
				res.json(result);
			});
			//To Delete user one by one
			app.delete("/allusersdata/:id", async (req, res) => {
				const id = req.params.id;
				console.log("Request to delete ", id);
				const deleteId = { _id: ObjectId(id) };
				const result = await userCollection.deleteOne(deleteId);
				res.send(result);
				console.log("user Successfully Deleted", result);
			});

			//To load single Teacher data
			app.get("/singleTeacher", async (req, res) => {
				const user = req.query;
				console.log("user", user);
				const result = await instructorCollection.findOne({
					email: user?.email,
				});
				res.send(result);
				console.log("Found one", result);
			});

			// To update single teacher About data
			app.put("/teacherAbout", async (req, res) => {
				const user = req.query;
				const filter = { email: user?.email };
				const updatedReq = req.body;
				console.log("Comming form UI", updatedReq);
				const options = { upsert: true };
				const updateFile = {
					$set: {
						displayName: updatedReq.displayName,
						designation: updatedReq.designation,
						phone: updatedReq.phone,
						age: updatedReq.age,
						gender: updatedReq.gender,
						address: updatedReq.address,
						about: updatedReq.about,
						experinece: updatedReq.experinece,
						skills: updatedReq.skills,
						language: updatedReq.language,
						type: updatedReq.type,
						operationDone: updatedReq.operationDone,
						facebook: updatedReq.facebook,
						twitter: updatedReq.twitter,
						linkedin: updatedReq.linkedin,
						photoURL: updatedReq.photoURL,
					},
				};
				const result = await instructorCollection.updateOne(
					filter,
					updateFile,
					options,
				);
				res.json(result);
				console.log("Updated Successfully", result);
			});
		} finally {
		}
	}
	run().catch(console.dir);
};
