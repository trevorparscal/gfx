Pipeline.modules.blur = function ( params ) {
	var radius = Number( params.radius ),
		mulTable = [
			512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
			454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512,
			482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456,
			437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512,
			497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328,
			320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456,
			446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335,
			329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512,
			505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
			399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328,
			324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271,
			268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456,
			451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388,
			385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335,
			332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
			289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259
		],
		shgTable = [
			9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
			17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
			19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
			20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
			21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
			21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
			22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
			22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
			23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
			23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
			23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
			23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
			24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
			24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
			24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
			24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24
		];

	function BlurStack() {
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 0;
		this.next = null;
	}

	return function () {
		if ( radius < 1 ) {
			return;
		}

		var x, y, i, p, yp, yi, yw, rSum, gSum, bSum, aSum, rOutSum, gOutSum, bOutSum,
			aOutSum, rInSum, gInSum, bInSum, aInSum, pr, pg, pb, pa, rbs, mulSum,
			shgSum, stackEnd,
			width = this.canvas.width,
			height = this.canvas.height,
			pixels = this.context.getImageData( 0, 0, width, height ),
			d = pixels.data,
			stackIn = null,
			stackOut = null,
			div = radius + radius + 1,
			widthMinus1 = width - 1,
			heightMinus1 = height - 1,
			radiusPlus1 = radius + 1,
			sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2,
			stackStart = new BlurStack(),
			stack = stackStart;

		for ( i = 1; i < div; i++ ) {
			stack = stack.next = new BlurStack();
			if ( i === radiusPlus1 ) {
				stackEnd = stack;
			}
		}
		stack.next = stackStart;

		yw = yi = 0;

		mulSum = mulTable[radius];
		shgSum = shgTable[radius];

		for ( y = 0; y < height; y++ ) {
			rInSum = gInSum = bInSum = aInSum = rSum = gSum = bSum = aSum = 0;

			rOutSum = radiusPlus1 * ( pr = d[yi] );
			gOutSum = radiusPlus1 * ( pg = d[yi + 1] );
			bOutSum = radiusPlus1 * ( pb = d[yi + 2] );
			aOutSum = radiusPlus1 * ( pa = d[yi + 3] );

			rSum += sumFactor * pr;
			gSum += sumFactor * pg;
			bSum += sumFactor * pb;
			aSum += sumFactor * pa;

			stack = stackStart;

			for ( i = 0; i < radiusPlus1; i++ ) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			for ( i = 1; i < radiusPlus1; i++ ) {
				p = yi + ( ( widthMinus1 < i ? widthMinus1 : i ) << 2 );
				rSum += ( stack.r = ( pr = d[p] ) ) * ( rbs = radiusPlus1 - i );
				gSum += ( stack.g = ( pg = d[p + 1] ) ) * rbs;
				bSum += ( stack.b = ( pb = d[p + 2] ) ) * rbs;
				aSum += ( stack.a = ( pa = d[p + 3] ) ) * rbs;

				rInSum += pr;
				gInSum += pg;
				bInSum += pb;
				aInSum += pa;

				stack = stack.next;
			}

			stackIn = stackStart;
			stackOut = stackEnd;
			for ( x = 0; x < width; x++ ) {
				d[yi + 3] = pa = ( aSum * mulSum ) >> shgSum;
				if ( pa !== 0 ) {
					pa = 255 / pa;
					d[yi] = ( ( rSum * mulSum) >> shgSum ) * pa;
					d[yi + 1] = ( ( gSum * mulSum) >> shgSum ) * pa;
					d[yi + 2] = ( ( bSum * mulSum) >> shgSum ) * pa;
				} else {
					d[yi] = d[yi + 1] = d[yi + 2] = 0;
				}

				rSum -= rOutSum;
				gSum -= gOutSum;
				bSum -= bOutSum;
				aSum -= aOutSum;

				rOutSum -= stackIn.r;
				gOutSum -= stackIn.g;
				bOutSum -= stackIn.b;
				aOutSum -= stackIn.a;

				p = ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;

				rInSum += ( stackIn.r = d[p] );
				gInSum += ( stackIn.g = d[p + 1] );
				bInSum += ( stackIn.b = d[p + 2] );
				aInSum += ( stackIn.a = d[p + 3] );

				rSum += rInSum;
				gSum += gInSum;
				bSum += bInSum;
				aSum += aInSum;

				stackIn = stackIn.next;

				rOutSum += ( pr = stackOut.r );
				gOutSum += ( pg = stackOut.g );
				bOutSum += ( pb = stackOut.b );
				aOutSum += ( pa = stackOut.a );

				rInSum -= pr;
				gInSum -= pg;
				bInSum -= pb;
				aInSum -= pa;

				stackOut = stackOut.next;

				yi += 4;
			}
			yw += width;
		}

		for ( x = 0; x < width; x++ ) {
			gInSum = bInSum = aInSum = rInSum = gSum = bSum = aSum = rSum = 0;

			yi = x << 2;
			rOutSum = radiusPlus1 * ( pr = d[yi] );
			gOutSum = radiusPlus1 * ( pg = d[yi + 1] );
			bOutSum = radiusPlus1 * ( pb = d[yi + 2] );
			aOutSum = radiusPlus1 * ( pa = d[yi + 3] );

			rSum += sumFactor * pr;
			gSum += sumFactor * pg;
			bSum += sumFactor * pb;
			aSum += sumFactor * pa;

			stack = stackStart;

			for ( i = 0; i < radiusPlus1; i++ ) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			yp = width;

			for ( i = 1; i <= radius; i++ ) {
				yi = ( yp + x ) << 2;

				rSum += ( stack.r = ( pr = d[yi] ) ) * ( rbs = radiusPlus1 - i );
				gSum += ( stack.g = ( pg = d[yi + 1] ) ) * rbs;
				bSum += ( stack.b = ( pb = d[yi + 2] ) ) * rbs;
				aSum += ( stack.a = ( pa = d[yi + 3] ) ) * rbs;

				rInSum += pr;
				gInSum += pg;
				bInSum += pb;
				aInSum += pa;

				stack = stack.next;

				if ( i < heightMinus1 ) {
					yp += width;
				}
			}

			yi = x;
			stackIn = stackStart;
			stackOut = stackEnd;
			for ( y = 0; y < height; y++ ) {
				p = yi << 2;
				d[p + 3] = pa = ( aSum * mulSum ) >> shgSum;
				if ( pa > 0 ) {
					pa = 255 / pa;
					d[p] = ( ( rSum * mulSum ) >> shgSum ) * pa;
					d[p + 1] = ( ( gSum * mulSum ) >> shgSum ) * pa;
					d[p + 2] = ( ( bSum * mulSum ) >> shgSum ) * pa;
				} else {
					d[p] = d[p + 1] = d[p + 2] = 0;
				}

				rSum -= rOutSum;
				gSum -= gOutSum;
				bSum -= bOutSum;
				aSum -= aOutSum;

				rOutSum -= stackIn.r;
				gOutSum -= stackIn.g;
				bOutSum -= stackIn.b;
				aOutSum -= stackIn.a;

				p = ( x + ( ( ( p = y + radiusPlus1 ) < heightMinus1 ? p : heightMinus1 ) * width ) ) << 2;

				rSum += ( rInSum += ( stackIn.r = d[p] ) );
				gSum += ( gInSum += ( stackIn.g = d[p + 1] ) );
				bSum += ( bInSum += ( stackIn.b = d[p + 2] ) );
				aSum += ( aInSum += ( stackIn.a = d[p + 3] ) );

				stackIn = stackIn.next;

				rOutSum += ( pr = stackOut.r );
				gOutSum += ( pg = stackOut.g );
				bOutSum += ( pb = stackOut.b );
				aOutSum += ( pa = stackOut.a );

				rInSum -= pr;
				gInSum -= pg;
				bInSum -= pb;
				aInSum -= pa;

				stackOut = stackOut.next;

				yi += width;
			}
		}

		this.context.putImageData( pixels, 0, 0 );
	};
};
