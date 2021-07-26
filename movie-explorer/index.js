var process = require("process");
var path = require("path");
var axios = require("axios");
const fs = require("fs");
const nrc = require("node-run-cmd");
const { fdir } = require("fdir");
// const location = "H:\\New folder\\Movies";
const location = "D:\\Downloads QB and Browser\\Movies\\Newer";

var finder = require("findit")(process.argv[2] || ".");

// const location = "D:\\Downloads QB and Browser\\Movies\\MOVIES AND TV";
// const location = "G:\\Movies"
// const location = "D:\\Downloads QB and Browser\\Movies\\MOVIES AND TV\\Nested";
// "D:\\Downloads QB and Browser\\Movies\\Newer";
// "H:\\New folder\\Movies";
// "D:\\Downloads QB and Browser\\Movies\\MOVIES AND TV\\Evil Dead";
process.chdir(location);
const API_KEY = "65a808e1de41c6756cc5f7b3183112a7";
var cors = require("cors");
var express = require("express");

var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const getMetaData = async ({ movieName, year, path }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { data } = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&query=${movieName}&year=${year}&page=1&include_adult=true`
      );
      // return data;
      if (data.results.length > 1) {
        data.results = [
          data.results.find((m) => m?.release_date?.split("-")[0] === year),
        ];
      }
      data.path = path;
      // console.log(movieName, year, data);
      resolve(data);
    } catch (error) {
      console.log(error);
      reject("Some error occurred");
    }
  });
};

let moviesArray = [];

const getMoviesData = async () => {
  try {
    console.log("Searching the directory for movies...");
    await finder.on("directory", async (dir, stat, stop) => {
      var base = path.basename(dir);
      const folderName = dir;
      if (base === ".git" || base === "node_modules") stop();
      else {
        let parentFolderIndex = moviesArray.findIndex(({ path }) =>
          `${location}\\${dir}`.includes(path)
        );

        if (parentFolderIndex > -1) moviesArray.splice(parentFolderIndex, 1);

        let year = (dir.match(/\d{4}/) || [])[0] || "";
        let movieName = (year ? dir.split(year) : [dir])[0];
        movieName = movieName.replace(/\./g, " ").replace("(", " ").trim();
        movieName = movieName.split("\\").slice(-1)[0];
        if (movieName)
          moviesArray.push({
            movieName,
            year,
            path: `${location}\\${folderName}\\`,
          });
      }
    });

    await finder.on("end", async () => {
      console.log(moviesArray);
      console.log("Movie folders found! Getting metadata from the internet...");
      let result = {
        data: [],
      };
      const data = await Promise.all(moviesArray.map(getMetaData));
      console.log("Fetched the data.");

      result.data.push(...data);
      console.log("Writing data...");
      fs.writeFileSync(
        __dirname + "/src/data/moviesData.json",
        JSON.stringify(result),
        "utf8"
      );
      console.log("Movies Data written!");
      return true;
    });

    await finder.on("error", function (err) {
      console.log(err);
    });
  } catch (error) {
    console.log(error);
  }
};

app.get("/", (req, res) => {
  res.send("Working!");
});

app.get("/getActors", async (req, res) => {
  const movieId = req.query.id;

  try {
    let { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}&language=en-US`
    );
    // console.log(data);
    data = {
      ...data,
      cast: data.cast.map((member) => ({
        ...member,
        profile_path: `https://image.tmdb.org/t/p/w200${member.profile_path}`,
      })),
    };
    res.json(data);
  } catch (error) {
    res.json(error);
  }
});

app.post("/openDirectory", async (req, res) => {
  let { path } = req.body;

  nrc
    .run(["explorer " + path], { cwd: path })
    .then((data) => console.log(data));
  res.json(req.body);
});

app.post("/playMovie", async (req, res) => {
  let { path } = req.body;

  fs.readdir(path, (err, files) => {
    files.some((file) => {
      if (
        file.toLowerCase().includes(".mp4") ||
        file.toLowerCase().includes(".mkv")
      ) {
        var options = {
          cwd: path,
        };
        nrc
          .run(["explorer " + file], options)
          .then((data) => console.log(data));
        res.json(req.body);
        return true;
      }
      return false;
    });
  });
});

const crawlPath = async (_path) => {
  return new Promise(async (resolve, reject) => {
    try {
      const api = new fdir()
        .withFullPaths()
        .onlyDirs()
        .exclude((dirName, dirPath) => dirPath.includes("_other"))
        .crawl(_path);
      resolve(await api.withPromise());
    } catch (error) {
      console.log(error);
      reject("Some error occurred");
    }
  });
};

app.get("/loadData", async (req, res) => {
  try {
    let moviesArray = [];
    let pathsList = [
      "D:\\Downloads QB and Browser\\Movies\\MOVIES AND TV",
      "D:\\Downloads QB and Browser\\Movies\\Newer",
    ];

    let foldersArray = await Promise.all(pathsList.map(crawlPath));
    foldersArray = foldersArray.flat();

    foldersArray.forEach((folderPath) => {
      let parentFolderIndex = moviesArray.findIndex(({ path }) =>
        folderPath.includes(path)
      );

      if (parentFolderIndex > -1) moviesArray.splice(parentFolderIndex, 1);

      let year = (folderPath.match(/\d{4}/) || [])[0] || "";
      let movieName = (year ? folderPath.split(year) : [folderPath])[0];
      movieName = movieName.replace(/\./g, " ").replace("(", " ").trim();
      movieName = movieName.split("\\").slice(-1)[0];
      if (movieName)
        moviesArray.push({
          movieName,
          year,
          path: folderPath,
        });
    });

    console.log("Movie folders found! Getting metadata from the internet...");
    let result = {
      data: [],
    };
    const data = await Promise.all(moviesArray.map(getMetaData));
    console.log("Fetched the data.");

    result.data.push(...data);
    console.log("Writing data...");
    fs.writeFileSync(
      __dirname + "/src/data/moviesData.json",
      JSON.stringify(result),
      "utf8"
    );
    console.log("Movies Data written!");

    res.json(moviesArray);
  } catch (error) {
    console.log(error);
  }
});

app.get("/multiple", async (req, res) => {
  const api = new fdir()
    .withFullPaths()
    .onlyDirs()
    .exclude((dirName, dirPath) => {
      return dirPath.includes("_other");
    })
    .crawl("D:\\Downloads QB and Browser\\Movies\\MOVIES AND TV");
});

// try {
//   console.log("Running...");
//   getMoviesData();
// } catch (error) {
//   console.log(error);
// }

app.listen(4000, function () {
  console.log("Movies Explorer Started on Port 4000");
});

// var options = {
//   cwd: "D:\\Downloads QB and Browser\\Movies\\MOVIES AND TV\\5x2 (2004)\\",
// };

// const fileName = "Watch 5x2 2004 x264 AC3-WAF mkv mp4 - ololo.MP4";
// console.log("fiolename", fileName);

// cmd.run('explorer ' + options.cwd + fileName, function (err, data, stderr) {
//   if(err) console.log(err)
//   else if(stderr) console.log(stderr)
//   else console.log("examples dir now contains the example file along with : ", data);
// });

// nrc.run([fileName], options).then((data) => console.log(data));
