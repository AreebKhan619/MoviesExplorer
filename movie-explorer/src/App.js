import {
  ChakraProvider,
  Container,
  SimpleGrid,
  Divider,
  Avatar,
  Badge,
} from "@chakra-ui/react";
import {
  Flex,
  Box,
  AspectRatio,
  Image,
  Text,
  Link,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalContent,
  ModalFooter,
  Button,
  Stack,
} from "@chakra-ui/react";
import movies from "./data/moviesData.json";
import genres from "./data/genres.json";
import React, { useEffect, useState } from "react";
import axios from "axios";

const LOCAL_URL = "http://localhost:4000";

function App() {
  useEffect(() => {
    console.log(movies.data);
  }, []);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showMore, setShowMore] = useState(false);

  const readMore = (movie) => {
    setSelectedMovie(movie);
    setShowMore(true);
  };

  const clearSelection = () => {
    setSelectedMovie(null);
    setShowMore(false);
  };

  const playHandler = async (path) => {
    console.log(path)
    const { data } = await axios.post(`${LOCAL_URL}/playMovie`, {path});
    console.log(data)
  };

  return (
    <ChakraProvider>
      <Box>Found {movies.data.length} entries</Box>
      <Flex padding="0 50px" centerContent>
        <Flex flexWrap="wrap">
          {movies.data.map(({ results, path }, i) => {
            if (!results.length) return null;
            const {
              title,
              id,
              original_title,
              release_date,
              vote_average,
              poster_path,
              overview,
            } = results[0];
            return (
              <Box key={id} p={2} borderWidth={1} maxWidth={280} margin={1}>
                <Image
                  objectFit="contain"
                  margin="auto"
                  src={`https://image.tmdb.org/t/p/w200/${poster_path}`}
                />
                <Stack
                  align={{ base: "center", md: "stretch" }}
                  textAlign={{ base: "center", md: "left" }}
                  mt={{ base: 4, md: 0 }}
                  ml={{ md: 2 }}
                >
                  <Flex justifyContent="space-between" paddingTop="2">
                    <Text
                      fontWeight="bold"
                      fontSize="lg"
                      letterSpacing="wide"
                      color="teal.600"
                    >
                      {title}{" "}
                      {title !== original_title && `(${original_title})`} (
                      {release_date.split("-")[0]})
                    </Text>
                    <Text
                      my={1}
                      display="block"
                      fontSize="md"
                      padding={2}
                      paddingTop="3px"
                      lineHeight="normal"
                      fontWeight="semibold"
                      maxHeight={30}
                      textAlign="center"
                      bgColor="#ab6a0a"
                      borderRadius={5}
                      color="white"
                    >
                      {vote_average}
                    </Text>
                  </Flex>

                  <Text
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      webkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    my={2}
                    color="gray.500"
                  >
                    {overview}
                  </Text>
                  <Button onClick={() => readMore(results[0])} my={2}>
                    Read More
                  </Button>
                  {/* <Content text={overview} /> */}
                  <Button
                    onClick={() => playHandler(path)}
                    colorScheme="blue"
                    my={2}
                  >
                    Play
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Flex>
      </Flex>

      <Modal
        isCentered={true}
        size="2xl"
        isOpen={showMore}
        onClose={clearSelection}
      >
        <ModalOverlay />

        {selectedMovie?.id && (
          <MovieModal
            clearSelection={clearSelection}
            selectedMovie={selectedMovie}
            playHandler={playHandler}
          />
        )}
      </Modal>
    </ChakraProvider>
  );
}

const labelColorGenerator = (index) => {
  switch (index % 4) {
    case 0:
      return "purple";
    case 1:
      return "red";
    case 2:
      return "green";
    case 3:
      return;
    default:
      return "green";
  }
};

const MovieModal = ({ selectedMovie, clearSelection, playHandler }) => {
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);

  useEffect(() => {
    const getCastAndCrew = async () => {
      const { data } = await axios.get(`${LOCAL_URL}/getActors`, {
        params: { id: selectedMovie.id },
      });
      console.log(data.cast);
      setCast(data.cast);
      setCrew(data.crew);
    };

    getCastAndCrew();
  }, [selectedMovie.id]);

  let directors =
    crew?.filter((member) => member.job.toLowerCase() === "director") || [];

  return (
    <>
      <ModalContent>
        <ModalHeader>
          {selectedMovie.title} ({selectedMovie.release_date.split("-")[0]})
          <Stack direction="row">
            {selectedMovie.genre_ids.map((id, i) => (
              <Badge key={id} colorScheme={labelColorGenerator(i)}>
                {genres[id]}
              </Badge>
            ))}
          </Stack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Container
            display="flex"
            p={0}
            maxWidth="inherit"
            lineHeight={1.3}
            mb={2}
          >
            <Image
              borderRadius="md"
              boxSize="200px"
              objectFit="cover"
              src={`https://image.tmdb.org/t/p/w200/${selectedMovie.poster_path}`}
              alt={selectedMovie.title}
            />
            <Box p={2}>
              <Box>{selectedMovie?.overview}</Box>
              <Box mt={2}>
                <Text color="grey" fontSize="sm">
                  Directed by
                </Text>
                <Stack direction="row">
                  {directors?.map((d) => (
                    <Text fontWeight="bold">{d.name}</Text>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Container>
          <Divider />
          <Flex mt={5} mb={5} overflowX="scroll">
            <Stack direction="row" justify="space-around" spacing="1rem" pb="5">
              {cast.slice(0, 6).map(({ character, name, profile_path }) => (
                <Container textAlign="center" lineHeight={1.1}>
                  <Avatar size="xl" name={name} src={profile_path} />
                  <Text fontWeight="bold" fontSize="sm">
                    {name}
                  </Text>
                  <Text fontSize="xs">{character}</Text>
                </Container>
              ))}
            </Stack>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={10} onClick={clearSelection}>
            Close
          </Button>
          <Button
            onClick={() => playHandler(selectedMovie.path)}
            width={100}
            colorScheme="blue"
            mr={3}
          >
            Play
          </Button>
        </ModalFooter>
      </ModalContent>
    </>
  );
};

export default App;
