// pages/Home.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import HeaderHome from '../components/layout/HeaderHome'; // Import the Header component
import Navigation from '../components/layout/Navigation'; // Import the Navigation component

const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatIDRTarget = (amount) => {
  if (amount <= 0) return '\u221E';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
  }).format(amount);
};

const isCampaignExpired = (deadline) => {
  if (!deadline) return false; // Campaigns with no deadline never expire
  return new Date(deadline) < new Date(); // Check if the deadline has passed
};

const formatDeadline = (deadline) => {
  if (!deadline) return 'tidak ada'; // Campaigns with no deadline
  const date = new Date(deadline);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const Home = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderInterval = useRef(null);
     
  useEffect(() => {
    const fetchFeaturedCampaigns = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/campaigns`);
        console.log(response.data); // Log the API response
        const featuredCampaigns = response.data.filter(campaign => campaign.is_featured === true);
        setFeaturedCampaigns(featuredCampaigns.slice(0, 4));
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };
  
    fetchFeaturedCampaigns();
  }, []);
  
  // Fetch regular campaigns (based on search query)
  const fetchCampaigns = async (search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/campaigns/`, 
        { params: { search } }
      );
      setCampaigns(response.data); // Set regular campaigns (search results)
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const newTimeout = setTimeout(() => {
      fetchCampaigns(query);
    }, 500);

    setSearchTimeout(newTimeout);
  };

  useEffect(() => {
    fetchCampaigns();
    
    // Clean up function
    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, []);

  // Set up automatic slider
  useEffect(() => {
    if (featuredCampaigns.length > 0) {
      sliderInterval.current = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % featuredCampaigns.length);
      }, 5000);
    }
    
    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [featuredCampaigns]);

  const goToSlide = (index) => {
    setActiveSlide(index);
    // Reset timer
    if (sliderInterval.current) {
      clearInterval(sliderInterval.current);
    }
    sliderInterval.current = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % featuredCampaigns.length);
    }, 5000);
  };

  // Sort campaigns based on the most donated
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    return (b.current_amount || 0) - (a.current_amount || 0);
  });

  return (
    <div className="body">
      <HeaderHome onSearch={handleSearch} />
  
      {/* Featured Campaign Slider */}
      <div className="px-4 pt-4" style={{ position: 'relative', zIndex: 10 }}>
        {featuredCampaigns.length > 0 && (
          <div className="relative rounded-lg overflow-hidden h-56">
            {/* Slides */}
            <div className="h-full">
              {featuredCampaigns.map((campaign, index) => {
                const isExpired = isCampaignExpired(campaign.deadline);
                
                return (
                  <div 
                    key={campaign.id}
                    className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
                      index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                  <Link to={`/kampanye/${campaign.slug || campaign.id}`}>
                    <img 
                      src={campaign.thumbnail || '/images/peduli-dhuafa-banner.jpg'} 
                      alt={campaign.title}
                      className="w-full h-56 object-cover"
                      onError={(e) => {
                        e.target.src = '/images/peduli-dhuafa-banner.jpg';
                      }}
                    />
                  </Link>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <h2 className="text-white font-bold text-lg">{campaign.title}</h2>

                      {/* Donate Button */}
                      {isExpired ? (
                        <button
                          className="w-full bg-gray-400 text-white py-2 rounded-md text-sm cursor-not-allowed"
                          disabled
                        >
                          DONASI SEKARANG
                        </button>
                      ) : (
                        <Link
                          to={`/berdonasi/${campaign.slug || campaign.id}`}
                          className="block text-center bg-green-800 text-white py-2 rounded-md text-sm hover:bg-green-900"
                        >
                          DONASI SEKARANG
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Indicators */}
            {featuredCampaigns.length > 0 && (
              <div className="absolute bottom-2 right-2 flex space-x-2 z-20">
                {featuredCampaigns.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === activeSlide ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
  
      {/* Campaign Grid */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {sortedCampaigns.map(campaign => {
              const isExpired = isCampaignExpired(campaign.deadline);
              const deadlineText = formatDeadline(campaign.deadline);

              return (
                <div key={campaign.id} className="bg-white rounded-lg overflow-hidden shadow">
                  <Link to={`/kampanye/${campaign.slug || campaign.id}`}>
                    <img 
                      src={campaign.thumbnail || '/placeholder-image.jpg'} 
                      alt={campaign.title}
                      className="w-full h-28 object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </Link>
                  <div className="p-2">
                    <h3 className="text-sm font-medium mb-2 line-clamp-2">{campaign.title}</h3>

                    {isExpired ? (
                      <p className="text-xs text-red-500">Waktu habis</p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Batas waktu: {deadlineText}
                      </p>
                    )}
                    {/* Progress bar */}
                    <div className="mt-1 mb-1">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-600 h-2.5 rounded-full" 
                          style={{ 
                            width: `${campaign.current_amount && campaign.target_amount 
                              ? Math.min((campaign.current_amount / campaign.target_amount) * 100, 100) 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 mt-1">
                          {campaign.current_amount ? formatIDR(campaign.current_amount) : 'Rp 0'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          dari {campaign.target_amount ? formatIDRTarget(campaign.target_amount) : 'Rp 0'}
                        </span>
                      </div>
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {campaign.target_amount > 0
                          ? Math.round((campaign.current_amount / campaign.target_amount) * 100) 
                          : 0} % tercapai
                      </div>
                    </div>

                    {/* Donate Button */}
                    {isExpired ? (
                      <button
                        className="w-full bg-gray-400 text-white py-2 rounded-md text-sm cursor-not-allowed"
                        disabled
                      >
                        DONASI SEKARANG
                      </button>
                    ) : (
                      <Link
                        to={`/berdonasi/${campaign.slug || campaign.id}`}
                        className="block text-center bg-green-800 text-white py-2 rounded-md text-sm hover:bg-green-900"
                      >
                        DONASI SEKARANG
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
  
        {error && (
          <div className="text-center py-4 text-red-500">
            {error}
            <button 
              onClick={() => fetchCampaigns(searchQuery)} 
              className="ml-4 px-4 py-2 bg-green-500 text-white rounded-lg"
            >
              Coba Lagi
            </button>
          </div>
        )}
      </div>
  
      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default Home;
