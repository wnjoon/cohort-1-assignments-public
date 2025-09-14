basic concept (technical stack)

- [React](https://react.dev/) + [Typescript](https://www.typescriptlang.org/) + [Next.js](https://nextjs.org/): frontend stack
- [Ethers.js@6](https://docs.ethers.org/v5/): blockchain interaction
- [RainbowKit](https://rainbowkit.com/): wallet connection
- [TypeChain](https://github.com/dethcrypto/TypeChain): type-safe contract interaction
- [Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/): hosting

basic concept (contract)

- MockERC20(TokenA, TokenB), MiniAMM, MiniAMMLP, MiniAMMFactory는 Flare Coston 2 testnet에 이미 배포된 컨트랙트를 사용할거야.
- 각 컨트랙트의 주소를 입력할 수 있는 변수를 하나 만들어줘. static 변수로 사용할거기 때문에 변수를 비워놓으면 내가 알아서 채워넣을게.
- 각 컨트랙트의 ABI는 out 디렉토리에 각 컨트랙트 파일의 이름으로 만들어진 디렉토리의 json 파일로 되어있어. foundry의 기본 규칙을 따르고 있으니까 그대로 참조하면 될거야.

초기 화면

- 현재 MiniAMM에 공급되어있는 각 토큰의 유동성 수량(TokenA, TokenB의 수량)
- 아직 지갑에 연결되어 있지 않는 상태이기 때문에, 사용자의 정보를 보여주는 공간은 없다.

지갑 연결

- RainbowKit을 사용해서 지갑에 연결할 수 있도록 해야한다.
- 우측 상단에 wallet connect라는 버튼이 있고, 이 버튼을 누르면 지갑을 연결하기 위한 모달이 나타나서 지갑과 연결된다.
- 지갑이 연결되면, 사용자가 보유하고있는 아래의 정보들이 추가로 표현되어야 한다.
    - 사용자가 보유하고 있는 TokenA, TokenB의 수량
    - 사용자가 현재 MiniAMM에 공급하고 있는 유동성으로 인하여 갖고 있는 LP 토큰 수량

토큰 발행

- 유동성 공급 및 스왑에 사용할 MockERC20 기반으로 만들어진 토큰(TokenA, TokenB) 각각을 발행하는 기능과 잔액을 조회할 수 있는 기능을 추가한다.
- 사용자가 보유하고있는 TokenA, TokenB의 수량이 토큰 발행으로 인하여 업데이트되어야 한다.
- 토큰 발행 시점에 오류(잘못된 토큰수량 등)가 발생하는 경우, 화면 내 별도의 공간에서 오류 내용을 보여준다.

유동성 공급

- Alice가 MiniAMM에 유동성을 위한 토큰쌍의 갯수를 입력한다.
    - 예) TokenA: 100, TokenB: 100.
- 등록한 토큰쌍에 대한 LP 토큰이 Alice에게 발행된다.
- 사용자가 보유하고 있는 LP 토큰의 수량이 화면에서 업데이트 되어야 한다.
- 유동성 공급 시점에 오류(잘못된 토큰 수량, 보유하고있는 수량보다 많은 입력량 등)가 발생하는 경우, 화면 내 별도의 공간에서 오류 내용을 보여준다.

스왑

- 스왑하고자 하는 토큰과 스왑하려는 양을 입력한다 → 공식에 따라 스왑의 결과로 실제 얻게되는 토큰의 갯수가 화면에 실시간으로 계산된다.
- swap 실행 버튼을 누르면, 해당 버튼은 트랜잭션 결과를 얻을때까지 비활성화 되어서 버튼을 중복으로 누르지 않도록 한다. 트랜잭션 결과가 나오면 다시 버튼을 활성화환다.
- swap 결과에 맞게 토큰의 양이 조절되고, 결과(변경된 MiniAMM 컨트랙트의 TokenA, TokenB 갯수)가 화면에서 변경되어야 한다.
- swap 시점에 오류(잘못된 토큰수량, swap 대상 토큰을 하나만 설정하지 않는 등)가 발생하는 경우, 화면 내 별도의 공간에서 오류 내용을 보여준다.

유동성 해제

- Alice가 MiniAMM으로부터 유동성을 해제하고자 하는 토큰을 선택하고 원하는 수량을 입력한다.
- Remove 버튼을 누르면 트랜잭션 결과를 얻을때까지 비활성화되어서 버튼을 중복으로 누르지 않도록 한다. 트랜잭션 결과가 나오면 다시 버튼을 활성화한다.
- Remove 결과에 맞게 변경된 MiniAMM의 전체 유동성 공급량이 화면에 보여야 한다.
- 유동성을 해제함으로써 변경된 Alice의 LP 보유량이 화면에 업데이트 되어야 한다.
- 유동성 해제 시점에 오류(잘못된 토큰수량, 공급한 유동성보다 많은 입력량 등)가 발생하는 경우, 화면 내 별도의 공간에서 오류 내용을 보여준다.