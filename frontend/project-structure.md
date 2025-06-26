src/
├── app/
│   ├── core/                          # Core functionality (guards, services, models)
│   │   ├── services/
│   │   ├── guards/
│   │   ├── models/
│   │   └── constants/
│   │
│   ├── shared/                        # Reusable components and utilities
│   │   ├── components/
│   │   ├── pipes/
│   │   └── validators/
│   │
│   ├── pages/                         # Main page components (simpler than "features")
│   │   ├── home/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── auth/
│   │   ├── profile/
│   │   └── admin/
│   │
│   ├── layout/                        # Layout components
│   │   ├── header/
│   │   ├── footer/
│   │   └── sidebar/
│   │
│   ├── app.component.*
│   ├── app.config.ts
│   └── app.routes.ts
│
├── assets/                            # Static assets
├── environments/
└── styles/