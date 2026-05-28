const Product = require('../models/Product');

// @desc    Get all products (with optional filtering)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { 
      gender, category, search, q, trending, collaboration, collaborationName,
      colors, sizes, minPrice, maxPrice, discount, sort 
    } = req.query;
    
    let query = {};

    // Filter by trending flag
    if (trending === 'true') {
      query.isTrending = true;
    }

    // Filter by collaboration parameters
    if (collaboration === 'true') {
      query.isCollaboration = true;
    }
    if (collaborationName) {
      query.collaborationName = { $regex: collaborationName, $options: 'i' };
    }

    // Filter by gender mapping (supports frontend menu queries: men, women, kids, etc.)
    if (gender) {
      // If multiple genders passed (e.g. from checkbox filters: "male,unisex")
      const genderArray = gender.split(',').map(g => g.trim().toLowerCase());
      
      let genderMatch = [];
      genderArray.forEach(g => {
        if (g === 'men') {
          genderMatch.push('male', 'unisex-adults', 'unisex', 'men');
        } else if (g === 'women') {
          genderMatch.push('female', 'unisex-adults', 'unisex', 'women');
        } else if (g === 'kids') {
          genderMatch.push('boys', 'girls', 'kids', 'unisex-kids', 'unisex');
        } else if (g === 'female') {
          genderMatch.push('female', 'women');
        } else if (g === 'male') {
          genderMatch.push('male', 'men');
        } else if (g === 'boys') {
          genderMatch.push('boys', 'unisex-kids');
        } else if (g === 'unisex-adults') {
          genderMatch.push('unisex-adults');
        } else if (g === 'unisex-kids') {
          genderMatch.push('unisex-kids');
        } else if (g === 'unisex') {
          genderMatch.push('unisex', 'unisex-adults');
        } else {
          genderMatch.push(g);
        }
      });
      
      if (genderMatch.length > 0) {
        query.gender = { $in: [...new Set(genderMatch)] };
      }
    }

    // Filter by category
    if (category) {
      if (category.includes(',')) {
        query.category = { $in: category.split(',').map(c => c.trim().toLowerCase()) };
      } else {
        query.category = category.toLowerCase();
      }
    }

    // Search query (supports search and q params)
    const searchVal = search || q;
    if (searchVal) {
      query.$or = [
        { name: { $regex: searchVal, $options: 'i' } },
        { description: { $regex: searchVal, $options: 'i' } }
      ];
    }

    let products = await Product.find(query).sort({ createdAt: -1 });

    // Node.js Filtering for complex frontend filters
    const parsePrice = (priceStr) => {
      if (!priceStr) return 0;
      if (typeof priceStr === "number") return priceStr;
      return parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
    };

    // 1. Colors Filter
    if (colors) {
      const colorArray = colors.split(',').map(c => c.trim().toLowerCase());
      const colorMap = {
        black: ["black", "navy"],
        white: ["white"],
        gray: ["gray", "grey"],
        blue: ["blue"],
        red: ["red"],
        green: ["green"],
        yellow: ["yellow"],
        orange: ["orange"],
        purple: ["purple"],
        brown: ["brown", "tan"],
        pink: ["pink"],
        "multi-colored": ["multi"],
      };
      
      products = products.filter(item => {
        const itemName = item.name?.toLowerCase() || "";
        return colorArray.some(color => {
          const keywords = colorMap[color] || [color];
          return keywords.some(keyword => itemName.includes(keyword));
        });
      });
    }

    // 2. Sizes Filter
    if (sizes) {
      const sizeArray = sizes.split(',').map(s => s.trim().toUpperCase());
      products = products.filter(item => {
        if (!item.sizes || item.sizes.length === 0) return true; // if no sizes in DB, skip filtering
        return item.sizes.some(s => sizeArray.includes(s.size.toUpperCase()));
      });
    }

    // 3. Price Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      const min = minPrice !== undefined ? parseInt(minPrice) : 0;
      const max = maxPrice !== undefined ? parseInt(maxPrice) : 999999;
      
      products = products.filter(item => {
        const price = parsePrice(item.offerPrice || item.price);
        return price >= min && price <= max;
      });
    }

    // 4. Discount Filter
    if (discount) {
      const discountArray = discount.split(',').map(d => d.trim().toLowerCase());
      
      products = products.filter(item => {
        if (!item.offerPrice) return false;
        const basePriceVal = parsePrice(item.price);
        const offerPriceVal = parsePrice(item.offerPrice);
        if (basePriceVal === 0) return false;
        
        const discountPercent = ((basePriceVal - offerPriceVal) / basePriceVal) * 100;
        
        return discountArray.some(df => {
          if (df === "15") return discountPercent >= 15 && discountPercent < 20;
          if (df === "less-than-20") return discountPercent < 20;
          if (df === "20-29") return discountPercent >= 20 && discountPercent < 30;
          if (df === "30-39") return discountPercent >= 30 && discountPercent < 40;
          return false;
        });
      });
    }

    // 5. Sorting
    if (sort) {
      products.sort((a, b) => {
        const priceA = parsePrice(a.offerPrice || a.price);
        const priceB = parsePrice(b.offerPrice || b.price);
        
        switch (sort) {
          case "price-low-high":
            return priceA - priceB;
          case "price-high-low":
            return priceB - priceA;
          case "discount-high-low":
            const discountA = a.offerPrice ? parsePrice(a.price) - priceA : 0;
            const discountB = b.offerPrice ? parsePrice(b.price) - priceB : 0;
            return discountB - discountA;
          case "newest":
            return new Date(b.createdAt) - new Date(a.createdAt);
          default:
            return 0; // best-matches / top-sellers default to no sort for now
        }
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      count: products.length,
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Get single product by id or slug
// @route   GET /api/products/:slugOrId
// @access  Public
exports.getProductByIdOrSlug = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    const product = await Product.findOne({
      $or: [{ productId: slugOrId }, { slug: slugOrId }]
    });

    if (!product) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      basePrice,
      discountType,
      discountValue,
      stock,
      gender,
      category,
      img,
      images,
      sizes,
      colors,
      styleNumber,
      isTrending,
      isCollaboration,
      collaborationName
    } = req.body;

    if (!name || !description || basePrice === undefined || stock === undefined || !gender) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Please fill in all required fields'
      });
    }

    // Auto-generate productId and slug from name
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900).toString();
    const productId = `${normalizedName}-${randSuffix}`;
    const slug = `${normalizedName}-${randSuffix}`;

    // Calculate display price strings
    const priceStr = `₹${basePrice.toLocaleString('en-IN')}`;
    let offerPriceStr = null;

    if (discountType === 'PERCENT' && discountValue > 0) {
      const discountedVal = Math.round(basePrice - (basePrice * discountValue) / 100);
      offerPriceStr = `₹${discountedVal.toLocaleString('en-IN')}`;
    } else if (discountType === 'FLAT' && discountValue > 0) {
      const discountedVal = Math.round(basePrice - discountValue);
      offerPriceStr = `₹${discountedVal.toLocaleString('en-IN')}`;
    }

    const product = await Product.create({
      productId,
      slug,
      name,
      description,
      img: img || '/Images/Products/cards/Easy-Rider-Leather-Unisex-Sneakers2.jpeg',
      images: images || [],
      sizes: sizes || undefined, // falls back to schema default if not provided
      colors: colors || undefined, // falls back to schema default if not provided
      styleNumber: styleNumber || undefined, // falls back to schema default if not provided
      basePrice: Number(basePrice),
      discountType: discountType || null,
      discountValue: Number(discountValue || 0),
      price: priceStr,
      offerPrice: offerPriceStr,
      stock: Number(stock),
      gender,
      category: category || 'footwear',
      isTrending: isTrending === true || isTrending === 'true',
      isCollaboration: isCollaboration === true || isCollaboration === 'true',
      collaborationName: collaborationName || undefined
    });

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // DB _id
    const {
      name,
      description,
      basePrice,
      discountType,
      discountValue,
      stock,
      gender,
      category,
      img,
      images,
      sizes,
      colors,
      styleNumber,
      isTrending,
      isCollaboration,
      collaborationName
    } = req.body;

    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Product not found'
      });
    }

    // Prepare fields to update
    const updateData = {};
    if (name) {
      updateData.name = name;
      // Regenerate slug / productId only if name changes
      const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      updateData.slug = `${normalizedName}-${product._id.toString().slice(-4)}`;
    }
    if (description) updateData.description = description;
    if (img) updateData.img = img;
    if (images) updateData.images = images;
    if (sizes) updateData.sizes = sizes;
    if (colors) updateData.colors = colors;
    if (styleNumber) updateData.styleNumber = styleNumber;
    if (stock !== undefined) updateData.stock = Number(stock);
    if (gender) updateData.gender = gender;
    if (category) updateData.category = category;
    if (discountType !== undefined) updateData.discountType = discountType || null;
    if (discountValue !== undefined) updateData.discountValue = Number(discountValue || 0);
    if (isTrending !== undefined) updateData.isTrending = (isTrending === true || isTrending === 'true');
    if (isCollaboration !== undefined) updateData.isCollaboration = (isCollaboration === true || isCollaboration === 'true');
    if (collaborationName !== undefined) updateData.collaborationName = collaborationName;

    // Recompute prices if basePrice, discountType, or discountValue are updated
    const finalBasePrice = basePrice !== undefined ? Number(basePrice) : product.basePrice;
    const finalDiscountType = discountType !== undefined ? discountType : product.discountType;
    const finalDiscountValue = discountValue !== undefined ? Number(discountValue) : product.discountValue;

    if (basePrice !== undefined) {
      updateData.basePrice = finalBasePrice;
    }

    if (basePrice !== undefined || discountType !== undefined || discountValue !== undefined) {
      updateData.price = `₹${finalBasePrice.toLocaleString('en-IN')}`;
      
      let offerPriceStr = null;
      if (finalDiscountType === 'PERCENT' && finalDiscountValue > 0) {
        const discountedVal = Math.round(finalBasePrice - (finalBasePrice * finalDiscountValue) / 100);
        offerPriceStr = `₹${discountedVal.toLocaleString('en-IN')}`;
      } else if (finalDiscountType === 'FLAT' && finalDiscountValue > 0) {
        const discountedVal = Math.round(finalBasePrice - finalDiscountValue);
        offerPriceStr = `₹${discountedVal.toLocaleString('en-IN')}`;
      }
      updateData.offerPrice = offerPriceStr;
    }

    product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};
