const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const capitalize = require("./util/capitalize");
const stringToBoolean = require("./util/stringToBoolean");

const app = express();

const getProjectsImages = (projects) => {
	const requests = projects.map(async (project) => {
		const { data } = await axios.get(project.url);
		const $ = cheerio.load(data);
		const projectImage = $("meta[property='og:image']").attr("content");
		return {
			...project,
			image: projectImage,
		};
	});

	return Promise.all(requests);
};

const getGithubApiData = async (username, projects) => {
	const githubApiUrl = `https://api.github.com/users/${username}/repos`;

	try {
		const { data } = await axios.get(githubApiUrl);
		let repos = [];

		data.forEach((repo) => {
			projects.forEach((project) => {
				const repoUrl = repo.html_url;
				const projectUrl = project.url;

				if (repoUrl.toLowerCase() === projectUrl.toLowerCase()) {
					repos.push({
						...project,
						createdYear: repo.created_at.slice(0, 4),
					});
				}
			});
		});

		if (repos.length === 0) {
			const msg = `Sorry, but we cannot find any of your pinned repositories in your Github API: https://api.github.com/users/${username}/repos.`;

			projects = [msg, ...projects];
			return projects;
		}

		return repos;
	} catch (error) {
		console.log(error);
		return error;
	}
};

const getPinnedProjects = async (
	username,
	needRepoImage = false,
	needCreatedAt = false
) => {
	if (!username) return [];

	const url = `https://github.com/${username}`;

	try {
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);
		const pinnedProjects = $(".pinned-item-list-item-content");

		let projects = [];

		pinnedProjects.each(async (index, element) => {
			const projectName = $(element)
				.find("span.repo[title]")
				.text()
				.replace(/\n/g, "");
			const projectUrl = `${url}/${projectName}`;

			projects.push({
				name: capitalize(projectName.replace(/-/g, " ")),
				url: projectUrl,
				description: $(element)
					.find("p.pinned-item-desc")
					.text()
					.replace(/\s\s+/g, ""),
			});
		});

		if (needRepoImage && needCreatedAt) {
			projects = await getProjectsImages(projects);
			projects = await getGithubApiData(username, projects);
			return projects;
		} else if (needRepoImage) {
			projects = await getProjectsImages(projects);
			return projects;
		} else if (needCreatedAt) {
			projects = await getGithubApiData(username, projects);
			return projects;
		}

		return projects;
	} catch (error) {
		if (error.response.status === 404)
			return {
				status: 404,
				msg: `No Github profile with this username: https://github.com/${username}`,
			};
		return error;
	}
};

app.get("/", async (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

app.get("/:username", async (req, res) => {
	const result = await getPinnedProjects(
		req.params.username,
		stringToBoolean(req.query.needrepoimage),
		stringToBoolean(req.query.needcreatedyear)
	);

	if (result.status === 404) {
		res.status(404).send(result);
	} else {
		res.send(result);
	}
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
