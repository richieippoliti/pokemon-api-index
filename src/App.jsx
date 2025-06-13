import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Search, Heart, ArrowLeft, Home } from 'lucide-react';

// manages favorites
const FavoritesContext = createContext();

const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('pokemon-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const addToFavorites = (pokemon) => {
    setFavorites(prev => {
      if (prev.find(p => p.id === pokemon.id)) return prev;
      const updated = [...prev, pokemon];
      localStorage.setItem('pokemon-favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromFavorites = (pokemonId) => {
    setFavorites(prev => {
      const updated = prev.filter(p => p.id !== pokemonId);
      localStorage.setItem('pokemon-favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (pokemonId) => {
    return favorites.some(p => p.id === pokemonId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addToFavorites, removeFromFavorites, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

const useFavorites = () => useContext(FavoritesContext);

// navigation
const Navigation = () => {
  const { favorites } = useFavorites();
  
  return (
    <nav className="bg-yellow-300 border-b-2 border-yellow-500 py-3">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl"></span>
          <h1 className="text-xl text-gray-900">Pokémon Index</h1>
        </Link>
        
        <div className="flex space-x-3">
          <Link to="/" className="bg-yellow-400 px-3 py-2 rounded text-gray-900 border border-yellow-600">
            <Home className="w-4 h-4 inline mr-1" />
            Search
          </Link>
          
          <Link to="/favorites" className="bg-red-400 px-3 py-2 rounded text-white border border-red-600 relative">
            <Heart className="w-4 h-4 inline mr-1" />
            Favorites
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

// the search page
const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchPokemon = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
      const data = await response.json();
      
      const filtered = data.results.filter(pokemon => 
        pokemon.name.toLowerCase().startsWith(query.toLowerCase())
      );
      
      const sorted = filtered.sort((a, b) => {
        const aId = parseInt(a.url.split('/').slice(-2, -1)[0]);
        const bId = parseInt(b.url.split('/').slice(-2, -1)[0]);
        return aId - bId;
      });

      const detailedResults = await Promise.all(
        sorted.map(async (pokemon) => {
          const detailResponse = await fetch(pokemon.url);
          return await detailResponse.json();
        })
      );
      
      setSearchResults(detailedResults);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) searchPokemon(searchTerm);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-yellow-100">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-8">
            <h2 className="text-4xl text-gray-900 mb-3">Discover Pokémon</h2>
            <p className="text-lg text-gray-700">Search and explore the world of Pokémon</p>
          </div>

          <div className="bg-yellow-200 border-2 border-yellow-400 rounded p-4 mb-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search Pokémon (e.g., pika, char)..."
                  className="w-full pl-10 pr-3 py-3 text-base border-2 border-yellow-400 rounded bg-white"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded border-2 border-blue-700"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <p className="text-lg text-gray-700">Searching for Pokémon...</p>
            </div>
          )}

          {!loading && hasSearched && searchResults.length === 0 && (
            <div className="text-center py-8 bg-red-200 border-2 border-red-400 rounded">
              <p className="text-lg text-gray-900">No Pokémon found. Try searching for something else!</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div>
              <h3 className="text-2xl text-gray-900 mb-4">Found {searchResults.length} Pokémon</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map(pokemon => (
                  <PokemonCard key={pokemon.id} pokemon={pokemon} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// the cards of the pokemon
const PokemonCard = ({ pokemon }) => {
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const favorite = isFavorite(pokemon.id);

  const toggleFavorite = (e) => {
    e.stopPropagation();
    if (favorite) {
      removeFromFavorites(pokemon.id);
    } else {
      addToFavorites(pokemon);
    }
  };

  const getTypeColor = (type) => {
    if (['fire', 'fighting', 'poison'].includes(type)) return 'bg-red-500';
    if (['water', 'ice', 'flying'].includes(type)) return 'bg-blue-500';
    if (['grass', 'bug', 'ground'].includes(type)) return 'bg-green-500';
    if (['electric', 'psychic'].includes(type)) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div 
      className="bg-yellow-200 border-2 border-yellow-400 rounded p-3 cursor-pointer"
      onClick={() => navigate(`/pokemon/${pokemon.id}`)}
    >
      <button
        onClick={toggleFavorite}
        className={`float-right p-1 rounded ${favorite ? 'text-red-600' : 'text-gray-500'}`}
      >
        <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
      </button>

      <div className="text-sm text-gray-600 mb-1">#{pokemon.id.toString().padStart(3, '0')}</div>
      <h3 className="text-lg capitalize text-gray-900 mb-3">{pokemon.name}</h3>

      <div className="text-center mb-3">
        <img
          src={pokemon.sprites.front_default || pokemon.sprites.front_shiny}
          alt={pokemon.name}
          className="w-20 h-20 mx-auto"
        />
      </div>

      <div className="flex flex-wrap gap-1 justify-center">
        {pokemon.types.map(type => (
          <span
            key={type.type.name}
            className={`px-2 py-1 rounded text-white text-xs ${getTypeColor(type.type.name)}`}
          >
            {type.type.name}
          </span>
        ))}
      </div>
    </div>
  );
};

// the details for each pokemon
const PokemonDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        setPokemon(data);
      } catch (error) {
        console.error('Failed to fetch Pokemon:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPokemon();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
        <p className="text-lg text-gray-700">Loading Pokémon details...</p>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-gray-900 mb-3">Pokémon not found!</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded border-2 border-blue-700"
          >
            Go back to search
          </button>
        </div>
      </div>
    );
  }

  const favorite = isFavorite(pokemon.id);

  return (
    <div className="min-h-screen bg-yellow-100">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-2 rounded border border-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="bg-yellow-200 border-2 border-yellow-400 rounded">
            
            <div className="bg-gray-800 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs mb-1">#{pokemon.id.toString().padStart(3, '0')}</div>
                  <h1 className="text-2xl capitalize mb-2">{pokemon.name}</h1>
                  <div className="flex gap-2">
                    {pokemon.types.map(type => (
                      <span key={type.type.name} className="bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs">
                        {type.type.name}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (favorite) {
                      removeFromFavorites(pokemon.id);
                    } else {
                      addToFavorites(pokemon);
                    }
                  }}
                  className={`p-2 rounded ${favorite ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-300'}`}
                >
                  <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-4">
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="bg-yellow-300 border-2 border-yellow-500 rounded p-3 inline-block">
                    <img
                      src={pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default}
                      alt={pokemon.name}
                      className="w-24 h-24 mx-auto"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg text-gray-900 mb-3">Base Stats</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {pokemon.stats.map(stat => (
                      <div key={stat.stat.name} className="bg-blue-200 border border-blue-400 rounded p-2 text-center">
                        <div className="text-xs text-gray-700 mb-1 capitalize">
                          {stat.stat.name.replace('-', ' ')}
                        </div>
                        <div className="text-lg text-gray-900">{stat.base_stat}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg text-gray-900 mb-3">Abilities</h3>
                <div className="space-y-2">
                  {pokemon.abilities.map(ability => (
                    <div key={ability.ability.name} className="bg-green-200 border border-green-400 rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 capitalize">{ability.ability.name.replace('-', ' ')}</span>
                        {ability.is_hidden && (
                          <span className="bg-purple-400 text-white text-xs px-2 py-1 rounded">Hidden</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FavoritesPage = () => {
  const { favorites } = useFavorites();

  return (
    <div className="min-h-screen bg-yellow-100">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl text-gray-900 mb-2">Your Favorite Pokémon</h2>
            <p className="text-lg text-gray-700">{favorites.length} favorites saved</p>
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No favorites yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map(pokemon => (
                <PokemonCard key={pokemon.id} pokemon={pokemon} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App
const App = () => {
  return (
    <FavoritesProvider>
      <Router>
        <div className="min-h-screen bg-yellow-100">
          <Navigation />
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/pokemon/:id" element={<PokemonDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Routes>
        </div>
      </Router>
    </FavoritesProvider>
  );
};

export default App;