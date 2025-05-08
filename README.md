# Roblox Studio MCP Server

Roblox Studio를 위한 Model Context Protocol(MCP) 서버 구현체로, TypeScript로 작성되었습니다.

## 개요

이 MCP 서버는 Roblox Studio 개발을 위해 특별히 설계된 리소스, 도구 및 프롬프트를 제공합니다. LLM 애플리케이션이 표준화된 인터페이스를 통해 Roblox Studio 문서, 템플릿, 코드 생성 기능 및 기타 기능에 액세스할 수 있게 합니다.

## 개선된 기능

- **인증 시스템**: JWT 기반 인증 및 권한 관리 시스템
- **Docker 지원**: 손쉬운 배포 및 확장을 위한 Docker 및 Docker Compose 설정
- **테스트 코드**: Jest를 사용한 단위 및 통합 테스트
- **CI/CD 파이프라인**: GitHub Actions를 사용한 자동화된 테스트 및 배포
- **보안 강화**: Helmet을 사용한 HTTP 헤더 보안 및 환경 변수 검증
- **로깅 개선**: Winston을 사용한 구조화된 로깅 시스템
- **모니터링**: 프로메테우스 및 그라파나 지원 (선택적)
- **확장 가능한 아키텍처**: 모듈화된 디자인으로 쉬운 확장 가능

## 특징

- **리소스**: Roblox Studio 문서, API 참조 및 코드 템플릿 접근
- **도구**: Luau 코드 생성 및 검증, 에셋 검색, 게임 컴포넌트 생성
- **프롬프트**: 스크립트 생성, 버그 찾기, 성능 최적화를 위한 특수 프롬프트
- **API 통합**: Roblox API 및 Open Cloud API와 직접 연결
- **대화형 시스템**: 대화 시스템, UI 인터페이스 및 복잡한 게임 플레이 메커니즘 생성
- **향상된 성능**: 최적의 성능을 위한 내장 캐싱 및 속도 제한
- **견고한 오류 처리**: 포괄적인 오류 관리 및 정상적인 오류 복구
- **메트릭 및 모니터링**: 내장된 상태 확인 및 성능 메트릭

## 사전 요구 사항

- Node.js >= 18.x
- npm 또는 yarn
- Docker 및 Docker Compose (선택 사항)
- Roblox API 키 (API 통합 기능용)
- Roblox Open Cloud API 키 (Open Cloud 기능용)

## 설치

1. 저장소 복제
```bash
git clone https://github.com/dmae97/roblox-studio-mcp-server-updated.git
cd roblox-studio-mcp-server-updated
```

2. 의존성 설치
```bash
npm install
```

3. `.env.example`을 기반으로 `.env` 파일 생성
```bash
cp .env.example .env
```

4. Roblox API 키 및 기타 구성으로 `.env` 파일 업데이트
```
ROBLOX_API_KEY=your_api_key_here
ROBLOX_OPEN_CLOUD_API_KEY=your_open_cloud_api_key_here
ROBLOX_OPEN_CLOUD_UNIVERSE_ID=your_universe_id_here
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

5. 프로젝트 빌드
```bash
npm run build
```

## 서버 실행

개발 모드에서 서버 시작:
```bash
npm run dev
```

또는 프로덕션 서버 시작:
```bash
npm start
```

서버는 기본적으로 포트 3000에서 시작됩니다(`.env`에서 구성 가능).

## Docker 실행

Docker를 사용하여 서버를 실행할 수도 있습니다:

```bash
# 이미지 빌드
npm run docker:build

# 컨테이너 실행
npm run docker:run
```

또는 docker-compose 사용:

```bash
docker-compose up -d
```

## 테스트 실행

단위 테스트 실행:
```bash
npm test
```

테스트 커버리지 보고서 생성:
```bash
npm run test:coverage
```

통합 테스트 실행:
```bash
npm run test:integration
```

## API 엔드포인트

### MCP 관련 엔드포인트
- `GET /sse` - MCP 통신을 위한 Server-Sent Events 엔드포인트
- `POST /messages` - MCP 통신을 위한 메시지 엔드포인트
- `GET /health` - 서버 상태 확인 엔드포인트
- `GET /metrics` - 서버 메트릭 엔드포인트

### 인증 관련 엔드포인트
- `POST /auth/login` - 사용자 로그인 및 토큰 발급
- `POST /auth/refresh` - 리프레시 토큰으로 새 액세스 토큰 발급
- `GET /auth/validate` - 토큰 유효성 확인
- `GET /auth/admin` - 관리자 권한 확인 (관리자 전용)

## 구성 옵션

서버는 `.env` 파일의 환경 변수를 사용하여 구성할 수 있습니다:

### 서버 구성
- `PORT` - 서버를 실행할 포트 (기본값: 3000)
- `SERVER_NAME` - 서버 이름 (기본값: "Roblox Studio MCP Server")
- `SERVER_VERSION` - 서버 버전 (기본값: "1.0.0")
- `NODE_ENV` - 환경 (development/production)
- `DEBUG` - 디버그 모드 활성화 (true/false)

### 로깅 구성
- `LOG_LEVEL` - 로깅 수준 (info, warn, error, debug)
- `LOG_TIMESTAMP` - 로그에 타임스탬프 포함 (true/false)
- `LOG_COLOR` - 로그 출력 색상화 (true/false)

### 성능 설정
- `ENABLE_RATE_LIMITING` - 속도 제한 활성화 (true/false)
- `RATE_LIMIT_WINDOW` - 속도 제한을 위한 시간 창(밀리초)
- `RATE_LIMIT_MAX_REQUESTS` - 창당 최대 요청 수
- `CACHE_TTL` - 캐시된 데이터의 유효 시간(초)
- `CACHE_CHECK_PERIOD` - 만료된 캐시 항목 확인 간격(초)

### 보안 설정
- `CORS_ORIGINS` - 허용된 오리진의 쉼표로 구분된 목록, 또는 모두 허용하기 위한 *
- `JWT_SECRET` - JWT 토큰 생성 및 검증을 위한 비밀 키
- `JWT_EXPIRES_IN` - 토큰 만료 시간(초) (기본값: 1시간)
- `JWT_REFRESH_SECRET` - JWT 리프레시 토큰 생성 및 검증을 위한 비밀 키
- `JWT_REFRESH_EXPIRES_IN` - 리프레시 토큰 만료 시간(초) (기본값: 1주일)

## 리소스

### 문서

- `docs://api/{section}` - Roblox Studio API 문서 접근
- `docs://api` - 사용 가능한 문서 섹션 나열
- `docs://luau` - Luau 언어 문서 및 모범 사례
- `docs://services/{service}` - 특정 Roblox 서비스에 대한 문서

### 템플릿

- `template://roblox/{category}/{name}` - 코드 템플릿 접근
- `template://roblox` - 사용 가능한 템플릿 나열
- `template://ui/{component}` - Roblox UI를 사용한 UI 컴포넌트 템플릿

## 개발

### 프로젝트 구조

```
.
├── src/                    # 소스 코드
│   ├── auth/              # 인증 관련 코드
│   ├── middleware/        # Express 미들웨어
│   ├── resources/         # MCP 리소스
│   ├── tools/             # MCP 도구
│   │   ├── datastore/     # DataStore 관련 도구
│   │   ├── interactive/   # 대화형 시스템 도구
│   │   ├── opencloud/     # Open Cloud 통합 도구
│   │   └── physics/       # 물리 시스템 도구
│   ├── prompts/           # MCP 프롬프트
│   ├── tests/             # 테스트 코드
│   ├── utils/             # 유틸리티 함수
│   └── index.ts           # 애플리케이션 진입점
├── prometheus/            # 프로메테우스 구성
├── .env.example          # 환경 변수 예시
├── Dockerfile            # Docker 빌드 정의
├── docker-compose.yml    # Docker Compose 구성
├── package.json          # 프로젝트 메타데이터 및 의존성
├── tsconfig.json         # TypeScript 구성
└── README.md             # 문서
```

## 기여

기여를 환영합니다! 자유롭게 PR을 제출해 주세요.

1. 포크 생성
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경 사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 열기

## 트러블슈팅

### 일반적인 문제

1. **연결 오류**: Roblox API 키가 올바르게 구성되었는지 확인하세요.
2. **인증 실패**: JWT 비밀 키가 올바르게 설정되었는지 확인하세요.
3. **메모리 사용량 높음**: 캐시 TTL 설정을 조정하여 메모리 사용량을 관리하세요.
4. **속도 제한 오류**: `RATE_LIMIT_*` 설정을 환경에 맞게 조정하세요.

### 로깅

문제를 디버깅하려면 `LOG_LEVEL=debug`로 설정하여 자세한 로깅을 활성화하세요.

## 라이선스

MIT
