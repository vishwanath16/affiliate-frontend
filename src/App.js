import React, { useState, useEffect } from 'react'
import './CardGrid.css'
import {
    Container,
    Card,
    CardMedia,
    CardContent,
    Typography,
    TextField,
    InputAdornment,
    Box,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import axios from 'axios'

const API_BASE_URL =
    window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : 'http://192.168.0.103:8000'
const LINK_PREVIEW_API_KEY = '6284bd688383e4ea39a51d9147f2eea3'

function cropImageToSquare(imageUrl) {
    return new Promise((resolve) => {
        const img = new window.Image()
        img.crossOrigin = 'Anonymous'
        img.onload = function () {
            const size = Math.min(img.width, img.height)
            const sx = (img.width - size) / 2
            const sy = (img.height - size) / 2
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)
            resolve(canvas.toDataURL('image/jpeg'))
        }
        img.onerror = function () {
            resolve(imageUrl) // fallback to original if error
        }
        img.src = imageUrl
    })
}

function App() {
    const [products, setProducts] = useState([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        let isMounted = true
        axios.get(`${API_BASE_URL}/api/products`).then(async (response) => {
            if (isMounted) {
                // Set products with placeholder if no photo
                const initialProducts = response.data.map((product) => {
                    let photoUrl = product.photo
                    if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
                        photoUrl = `${API_BASE_URL}${photoUrl}`
                    }
                    return {
                        ...product,
                        photo:
                            photoUrl ||
                            'https://via.placeholder.com/400x200?text=No+Image',
                    }
                })
                // Sort by created_at descending (latest first)
                initialProducts.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                )
                setProducts(initialProducts)

                // Fetch and crop preview images for products with no real photo
                await Promise.all(
                    initialProducts.map(async (product, idx) => {
                        if (
                            !product.photo ||
                            product.photo.includes('placeholder')
                        ) {
                            try {
                                const previewRes = await axios.get(
                                    `https://api.linkpreview.net/?key=${LINK_PREVIEW_API_KEY}&q=${encodeURIComponent(
                                        product.link
                                    )}`
                                )
                                if (previewRes.data?.image) {
                                    const cropped = await cropImageToSquare(
                                        previewRes.data.image
                                    )
                                    setProducts((prev) => {
                                        const updated = [...prev]
                                        updated[idx] = {
                                            ...updated[idx],
                                            photo: cropped,
                                        }
                                        return updated
                                    })
                                }
                            } catch (e) {
                                // Ignore errors, fallback to placeholder
                            }
                        }
                    })
                )
            }
        })
        return () => {
            isMounted = false
        }
    }, [])

    const handleCardClick = (link) => {
        window.open(link, '_blank', 'noopener noreferrer')
    }

    const handleImageLoad = (id) => {
        // setImageLoaded((prev) => ({ ...prev, [id]: true })) // Removed unused state
    }
    const handleImageError = (id) => {
        // setImageLoaded((prev) => ({ ...prev, [id]: true })) // Removed unused state
        // setImageError((prev) => ({ ...prev, [id]: true })) // Removed unused state
    }

    const filteredProducts = products.filter((product) =>
        product.title.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Container maxWidth={false} disableGutters className="app-bg">
            <div className="logo-container">
                <img
                    src={process.env.PUBLIC_URL + '/vishwayathri.png'}
                    alt="VishwaYathri Logo"
                    className="logo-img"
                />
            </div>
            <div className="search-bar-container">
                <TextField
                    variant="outlined"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-bar-input"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon style={{ color: '#e52e71' }} />
                            </InputAdornment>
                        ),
                        style: {
                            background: '#fff',
                            borderRadius: 10,
                        },
                    }}
                    sx={{
                        width: 360,
                        boxShadow: '0 2px 8px 0 rgba(229,46,113,0.07)',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e0e0e0',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e52e71',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e52e71',
                        },
                    }}
                />
            </div>
            <div className="card-grid-container">
                {filteredProducts.map((product, idx) => (
                    <Card
                        className="card-grid-card"
                        key={product.id}
                        onClick={() => handleCardClick(product.link)}
                        elevation={4}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                height: 120,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                marginBottom: '10px',
                            }}
                        >
                            {/* Remove buffering animation */}
                            <Box className="card-grid-image-box">
                                <CardMedia
                                    component="img"
                                    className="card-grid-media"
                                    image={product.photo}
                                    alt={product.title}
                                    loading="lazy"
                                    onLoad={() => handleImageLoad(product.id)}
                                    onError={() => handleImageError(product.id)}
                                    style={{}}
                                />
                            </Box>
                        </Box>
                        <CardContent className="card-grid-content">
                            <Typography
                                gutterBottom
                                variant="h6"
                                component="div"
                                className="card-grid-title"
                            >
                                {product.title}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </Container>
    )
}

export default App
