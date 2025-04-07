# Roblox Studio MCP Server

Roblox Studio를 위한 Model Context Protocol(MCP) 서버 구현체로, TypeScript로 작성되었습니다.

## 개요

이 MCP 서버는 Roblox Studio 개발을 위해 특별히 설계된 리소스, 도구 및 프롬프트를 제공합니다. LLM 애플리케이션이 표준화된 인터페이스를 통해 Roblox Studio 문서, 템플릿, 코드 생성 기능 및 기타 기능에 액세스할 수 있게 합니다.

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
- Roblox API 키 (API 통합 기능용)
- Roblox Open Cloud API 키 (Open Cloud 기능용)

## 설치

1. 저장소 복제
```bash
git clone https://github.com/dmae97/roblox-studio-mcp-server.git
cd roblox-studio-mcp-server
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

## Docker 실행 (향후 지원 예정)

Docker를 사용하여 서버를 실행할 수도 있습니다:

```bash
# 이미지 빌드
docker build -t roblox-studio-mcp-server .

# 컨테이너 실행
docker run -p 3000:3000 -v .env:/app/.env roblox-studio-mcp-server
```

또는 docker-compose 사용:

```bash
docker-compose up
```

## 구성 옵션

서버는 `.env` 파일의 환경 변수를 사용하여 구성할 수 있습니다:

### 서버 구성
- `PORT` - 서버를 실행할 포트 (기본값: 3000)
- `SERVER_NAME` - 서버 이름 (기본값: "Roblox Studio MCP Server")
- `SERVER_VERSION` - 서버 버전 (기본값: "1.0.0")
- `NODE_ENV` - 환경 (development/production)

### 로깅 구성
- `DEBUG` - 디버그 모드 활성화 (true/false)
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
- `JWT_SECRET` - JWT 토큰 검증을 위한 비밀 키

## API 엔드포인트

- `GET /sse` - MCP 통신을 위한 Server-Sent Events 엔드포인트
- `POST /messages` - MCP 통신을 위한 메시지 엔드포인트
- `GET /health` - 상태 확인 엔드포인트
- `GET /metrics` - 서버 메트릭 엔드포인트

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

## 도구

### 코드 생성기

`generate-roblox-code` 도구는 사용자 사양에 따라 Roblox Luau 코드를 생성합니다.

매개변수:
- `scriptType`: 생성할 스크립트 유형 (ServerScript, LocalScript, ModuleScript)
- `functionality`: 스크립트가 수행해야 할 작업에 대한 설명
- `includeComments`: 코드에 주석을 포함할지 여부
- `targetRobloxVersion`: (선택 사항) 대상 Roblox 버전

### 에셋 검색기

`find-roblox-assets` 도구는 사용자 기준에 따라 Roblox 에셋을 검색합니다.

매개변수:
- `assetType`: 검색할 에셋 유형 (Model, Decal, Mesh, Animation, Sound, Texture)
- `keywords`: 검색 키워드 또는 태그
- `maxResults`: 반환할 최대 결과 수
- `includeDetails`: 상세한 에셋 정보를 포함할지 여부

### 스크립트 검증기

`validate-roblox-script` 도구는 구문 오류 및 모범 사례에 대해 Luau 스크립트를 검증합니다.

매개변수:
- `scriptContent`: 검증할 Luau 스크립트 내용
- `scriptType`: 스크립트 유형 (ServerScript, LocalScript, ModuleScript)
- `checkBestPractices`: 모범 사례 확인 여부
- `checkPerformance`: 성능 문제 확인 여부

### 새로운 도구

#### 데이터 저장소 관리자

`create-datastore-system` 도구는 지속적인 데이터 관리를 위한 완전한 DataStore 코드를 생성합니다.

매개변수:
- `datastoreName`: DataStore 이름
- `dataStructure`: 저장할 데이터의 구조
- `sessionCaching`: 세션 캐싱 로직을 포함할지 여부
- `backupStrategy`: 데이터 백업 전략
- `playerData`: 플레이어 데이터인지 여부

#### 물리 시스템 생성기

`create-physics-system` 도구는 Roblox용 물리 기반 시스템을 생성합니다.

매개변수:
- `objectName`: 물리적 객체의 이름
- `objectType`: 물리적 객체 유형
- `size`: 크기 치수
- `material`: 재질 유형
- `physicsProperties`: 밀도, 마찰 등
- `constraints`: 선택적 물리적 제약 조건

#### UI 빌더

`create-ui-system` 도구는 Roblox UI 코드를 생성합니다.

매개변수:
- `uiType`: UI 유형 (Menu, HUD, Dialog, Inventory)
- `elements`: 포함할 UI 요소
- `responsive`: UI가 반응형이어야 하는지 여부
- `stylePreset`: 사용할 시각적 스타일 프리셋

### Roblox API 커넥터

Roblox API에 직접 연결하기 위한 도구:

#### 에셋 검색 API

`roblox-search-assets` 도구는 공식 Roblox API를 사용하여 에셋을 검색합니다.

#### Open Cloud 통합

`roblox-open-cloud` 도구는 Roblox Open Cloud API 기능에 대한 액세스를 제공합니다.

매개변수:
- `feature`: 사용할 Open Cloud 기능
- `universeId`: 작업할 Universe ID
- `actionType`: 수행할 작업 유형
- `data`: 작업에 대한 데이터

## 프롬프트

### 스크립트 생성기

`generate-script` 프롬프트는 AI 지원으로 Roblox 스크립트를 생성하는 데 도움이 됩니다.

매개변수:
- `scriptType`: 생성할 스크립트 유형
- `functionality`: 스크립트가 수행해야 할 작업에 대한 설명
- `includeComments`: 코드에 주석을 포함할지 여부
- `complexity`: 복잡성 수준 (Beginner, Intermediate, Advanced)
- `targetAudience`: 대상 청중 (Child, Teen, Adult)

### 버그 검색기

`find-bugs` 프롬프트는 버그를 분석하고 개선 사항을 제안합니다.

매개변수:
- `scriptContent`: 분석할 Luau 스크립트 내용
- `scriptType`: 스크립트 유형
- `checkPerformance`: 성능 문제 확인 여부
- `checkSecurity`: 보안 문제 확인 여부
- `suggestImprovements`: 개선 사항 제안 여부

### 성능 최적화기

`optimize-performance` 프롬프트는 더 나은 성능을 위해 Roblox 스크립트를 분석하고 최적화합니다.

매개변수:
- `scriptContent`: 최적화할 스크립트
- `targetFPS`: 대상 초당 프레임 수
- `optimizationLevel`: 적용할 최적화 수준
- `preserveReadability`: 가독성을 우선시할지 여부

## 개발

### 프로젝트 구조

- `src/index.ts` - 메인 서버 파일
- `src/utils/` - 유틸리티 함수
- `src/middleware/` - 오류 처리, 속도 제한 등을 위한 Express 미들웨어
- `src/tools/` - MCP 도구 구현
- `src/resources/` - MCP 리소스 구현
- `src/prompts/` - MCP 프롬프트 구현
- `src/api/` - Roblox API 클라이언트 구현
- `src/tools/interactive/` - 대화형 시스템 및 UI 도구
- `src/tools/physics/` - 물리 시스템 도구
- `src/tools/datastore/` - DataStore 관리 도구
- `src/tools/opencloud/` - Open Cloud API 통합

### 테스트 (향후 지원 예정)

단위 테스트 실행:
```bash
npm test
```

통합 테스트 실행:
```bash
npm run test:integration
```

전체 테스트 커버리지 보고서 생성:
```bash
npm run test:coverage
```

### MCP 통합 예제

다양한 LLM 애플리케이션에서 이 MCP 서버를 사용하는 방법에 대한 예제:

#### 예제 1: Claude와 API 사용

```javascript
// Claude를 사용하여 웹 애플리케이션에서 MCP 서버를 호출하는 예제 코드
async function callRobloxMcp() {
  const response = await fetch('https://your-claude-api-endpoint/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-claude-api-key'
    },
    body: JSON.stringify({
      model: "claude-3.7-sonnet-20250219",
      messages: [
        {
          role: "user",
          content: "Roblox Studio에서 플랫포머 게임을 만드는 데 도움을 주시겠어요?"
        }
      ],
      tool_choice: "auto",
      tools: [
        {
          function: {
            name: "mcp",
            description: "Roblox Studio MCP 서버 호출",
            parameters: {
              type: "object",
              properties: {
                server_url: {
                  type: "string",
                  description: "MCP 서버의 URL"
                },
                tool_name: {
                  type: "string",
                  description: "호출할 MCP 도구의 이름"
                },
                tool_parameters: {
                  type: "object",
                  description: "MCP 도구에 대한 매개변수"
                }
              },
              required: ["server_url", "tool_name"]
            }
          }
        }
      ]
    })
  });
  
  return await response.json();
}
```

#### 예제 2: CLI 도구로 MCP 서버 사용

또한 명령줄을 통해 MCP 서버를 사용할 수도 있습니다:

```bash
# MCP 클라이언트 CLI 설치
npm install -g @modelcontextprotocol/cli

# MCP 서버에 연결
mcp connect http://localhost:3000

# MCP 도구 사용
mcp tool generate-roblox-code --scriptType=ServerScript --functionality="플레이어 이동 처리" --includeComments=true

# 템플릿 접근
mcp resource template://roblox/game/platformer
```

#### 예제 3: Anthropic의 Claude와 연결

```python
import anthropic
from anthropic.tool_use import MCP

# Claude 클라이언트 초기화
client = anthropic.Client(api_key="your-anthropic-api-key")

# MCP 연결 생성
mcp = MCP(server_url="http://localhost:3000")

# MCP 기능을 갖춘 Claude에 메시지 보내기
response = client.messages.create(
    model="claude-3.7-sonnet-20250219",
    max_tokens=1000,
    system="당신은 Roblox Studio MCP 서버에 접근할 수 있는 도움이 되는 AI 어시스턴트입니다.",
    messages=[
        {
            "role": "user",
            "content": "Roblox Studio에서 멀티플레이어 게임을 만들고 싶어요. 어떤 도구를 사용해야 할까요?"
        }
    ],
    tools=[mcp.to_tool()]
)

print(response.content)
```

### 스크립트

- `npm run build` - 프로젝트 빌드
- `npm run dev` - 핫 리로드가 있는 개발 모드에서 실행
- `npm start` - 프로덕션 서버 실행
- `npm run lint` - 린팅 실행
- `npm test` - 테스트 실행

## 트러블슈팅

### 일반적인 문제

1. **연결 오류**: Roblox API 키가 올바르게 구성되었는지 확인하세요.
2. **메모리 사용량 높음**: 캐시 TTL 설정을 조정하여 메모리 사용량을 관리하세요.
3. **속도 제한 오류**: `RATE_LIMIT_*` 설정을 환경에 맞게 조정하세요.

### 로깅

문제를 디버깅하려면 `LOG_LEVEL=debug`로 설정하여 자세한 로깅을 활성화하세요.

## 최근 업데이트

- 사용자 정의 미들웨어로 오류 처리 개선
- 구성 가능한 수준 및 포맷팅으로 로깅 시스템 향상
- 성능 향상을 위한 캐싱 시스템 구현
- 악용 방지를 위한 속도 제한 추가
- 더 나은 모니터링을 위한 메트릭 엔드포인트 확장
- 정상 종료 처리 추가
- 최신 Roblox API 엔드포인트로 업데이트
- 이름 불일치 수정 (Roblex → Roblox)

## 향후 계획된 기능

- **JWT 인증**: 보안 강화를 위한
- **API 문서화**: OpenAPI/Swagger 통합
- **Docker 지원**: 쉬운 배포를 위한 컨테이너화
- **테스트 수트**: 전체 유닛 및 통합 테스트
- **CI/CD 파이프라인**: 자동화된 테스트 및 배포

## 기여

기여를 환영합니다! 자유롭게 Pull Request를 제출해 주세요.

## 라이선스

MIT
