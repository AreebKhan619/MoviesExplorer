var process = require("process");
var finder = require("findit")(process.argv[2] || ".");
var path = require("path");
var axios = require("axios");
const fs = require("fs");
const nrc = require("node-run-cmd");
// const location = "H:\\New folder\\Movies";
// const location = "D:\\Downloads QB and Browser\\Movies\\Newer";
const location =
  "D:\\Downloads QB and Browser\\Movies\\MOVIES AND TV";
process.chdir(location);
const API_KEY = "65a808e1de41c6756cc5f7b3183112a7";
var cors = require("cors");
var express = require("express");

var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// const moviesRouter = require("./router/moviesRouter");
// app.use("/movies", moviesRouter);

// console.log(process.cwd());
// console.log(__dirname);

const getMetaData = async ({ movieName, year, path }) => {
  return new Promise(async (resolve, reject) => {
    let { data } = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&query=${movieName}&year=${year}&page=1&include_adult=true`
    );
    // return data;
    data.path = path;
    resolve(data);
  });
};

let moviesArray = [];

const getMoviesData = async () => {
  console.log("Searching the directory for movies...");
  await finder.on("directory", async (dir, stat, stop) => {
    var base = path.basename(dir);
    const folderName = dir;
    if (base === ".git" || base === "node_modules") stop();
    else {
      // console.log(dir)
      if (dir.includes("(")) {
        if (dir.includes("\\")) {
          dir = dir.split("\\")[1];
        }
        // console.log(`${location}\\${folderName}\\`)
        let movieNameYear = dir;
        let nameOnly = movieNameYear.split("(")[0];
        moviesArray.push({
          movieName: nameOnly.trim(),
          year: movieNameYear.match(/\d+/),
          path: `${location}\\${folderName}\\`,
        });
      }
    }
  });

  finder.on("end", async () => {
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
  });
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

try {
  console.log("Running...");
  getMoviesData();
} catch (error) {
  console.log(error);
}

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
