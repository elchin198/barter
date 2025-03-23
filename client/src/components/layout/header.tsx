<Link href="/" className="flex items-center">
              <img 
                src="/logo.svg" 
                alt="BarterTap.az" 
                className="h-8 md:h-10 transition-transform hover:scale-105 duration-300"
                onError={(e) => {
                  e.currentTarget.src = "/barter-logo.png";
                  e.currentTarget.onerror = null;
                }}
              />
            </Link>