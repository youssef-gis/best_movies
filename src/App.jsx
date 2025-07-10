import { useState, useEffect } from 'react'
import { useDebounce } from 'react-use'

import './App.css'
import Search from './components/search'
import Spinner from './components/spinner'
import MovieCard from './components/movieCard';
import   {updateSearchCount, getTrendingMovies} from './appwrite.js'

const API_BASE_URL= 'https://api.themoviedb.org/3/';
const API_KEY= import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS= {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
}


function App() {
  const [searchTerm, setSearchTerm]= useState('');
  const [errorMessage, setErrorMessage]= useState('');
  const [moviesList, setMoviesList]= useState([]);
  const[trendingMovies, setTrendingMovies]= useState([]);
  const [isLoading, setIsLoading]= useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm]= useState(searchTerm)

  const fetchMovies = async (query='')=>{
    setIsLoading(true);
    setErrorMessage('');
    try {

      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`:
       `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response= await fetch(endpoint, API_OPTIONS);
      if (!response.ok){
        throw new Error(`Http error! status: ${response.status}`)
      }
      const data= await response.json();
      console.log(data.results)

      if (data.Response === 'False'){
        setErrorMessage(data.Error || 'Failed to fetch Movies, please try again Later');
        setMoviesList([]);
        return;
      }

      setMoviesList(data.results || []);
      if (query && data.results.length > 0){
        // Update search count in Appwrite
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.error(`Error fetching Movies: ${error}`)
      setErrorMessage('Failed to fetch Movies Try again Later ')
    }
    finally {
      setIsLoading(false);
    }
  }
  const fetchTrendingMovies = async () => {
    try {
      const trendingMovies= await getTrendingMovies();
      setTrendingMovies(trendingMovies);
    } catch (error) {
      console.error('Error fetching trending movies:', error)
    }
  }

  useDebounce( ()=>{
    setDebouncedSearchTerm(searchTerm)
  }, 4000, [searchTerm] );

  useEffect(()=>{
    fetchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  useEffect( ()=>{
    fetchTrendingMovies()
  }, [] )

  return (
    
      <main>
        <div className='pattern' />

        <div className='wrapper' >
          <header>
            <img src="/hero.png" alt="hero Banner"/>
            <h1>Find <span className='text-gradient' >Movies</span> You will enjoy without Hastle</h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}  />
          </header>

          { trendingMovies.length > 0 && (
            <section className='trending' >
              <h2 className='text-white' >Trending Movies</h2>
              <ul>
                {trendingMovies.map( (movie, idx)=>(
                  <li key={movie.$id}>
                    <p>{idx + 1}</p>
                    <img src={movie.poster_url} alt={movie.title} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className='all-movies'>
            <h2 className='mt-[40px]' >All Movies</h2>

            {isLoading ? (<Spinner />) :
             errorMessage ? (<p className='text-red-500'>{errorMessage}</p>) :
            (<ul>
              {moviesList.map(  (movie)=>(
              < MovieCard key={movie.id}  movie={movie} />
            ) )}
            </ul>
            )
            }
            
          </section>
        </div>
      </main>
    
  )
}

export default App
