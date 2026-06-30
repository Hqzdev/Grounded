use axum::{
    extract::{Path, State},
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use reqwest::Client;
use serde::Serialize;
use serde_json::Value;
use std::{collections::BTreeMap, env, net::SocketAddr, sync::Arc, time::Duration};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[derive(Clone)]
struct AppState {
    client: Client,
    services: Arc<ServiceDirectory>,
}

#[derive(Clone)]
struct ServiceDirectory {
    auth: String,
    ingestion: String,
    retrieval: String,
}

#[derive(Serialize)]
struct GatewayHealth {
    service: &'static str,
    status: &'static str,
    dependencies: BTreeMap<&'static str, DependencyHealth>,
}

#[derive(Serialize)]
struct DependencyHealth {
    status: String,
    url: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let services = ServiceDirectory {
        auth: env_or("AUTH_SERVICE_URL", "http://localhost:8001"),
        ingestion: env_or("INGESTION_SERVICE_URL", "http://localhost:8002"),
        retrieval: env_or("RETRIEVAL_SERVICE_URL", "http://localhost:8004"),
    };

    let state = AppState {
        client: Client::builder()
            .timeout(Duration::from_secs(3))
            .build()
            .expect("failed to create http client"),
        services: Arc::new(services),
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/health", get(health))
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/auth/refresh", post(refresh))
        .route("/api/auth/logout", post(logout))
        .route("/api/auth/logout-all", post(logout_all))
        .route("/api/auth/me", get(me))
        .route("/api/auth/email/verify", post(verify_email))
        .route("/api/auth/email/resend", post(resend_verification))
        .route("/api/auth/password/forgot", post(forgot_password))
        .route("/api/auth/password/reset", post(reset_password))
        .route("/api/auth/password/change", post(change_password))
        .route("/api/auth/sessions", get(list_sessions))
        .route("/api/auth/sessions/:session_id", delete(revoke_session))
        .route("/api/tenants", post(create_tenant))
        .route("/api/tenants/current", get(current_tenant))
        .route("/api/documents", get(list_documents).post(create_document))
        .route("/api/documents/:document_id", get(get_document))
        .route("/api/documents/:document_id/jobs", get(list_document_jobs))
        .route("/api/questions", post(answer_question))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let port = env_or("PORT", "8080");
    let addr: SocketAddr = format!("0.0.0.0:{port}")
        .parse()
        .expect("invalid listen address");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind gateway");

    axum::serve(listener, app).await.expect("gateway crashed");
}

async fn health(State(state): State<AppState>) -> Json<GatewayHealth> {
    let mut dependencies = BTreeMap::new();

    dependencies.insert("auth", check_service(&state.client, &state.services.auth).await);
    dependencies.insert(
        "ingestion",
        check_service(&state.client, &state.services.ingestion).await,
    );
    dependencies.insert(
        "retrieval",
        check_service(&state.client, &state.services.retrieval).await,
    );

    Json(GatewayHealth {
        service: "gateway",
        status: "ok",
        dependencies,
    })
}

async fn create_document(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(
        &state.client,
        &state.services.ingestion,
        "/documents",
        payload,
        &headers,
    )
    .await
}

async fn list_documents(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_get(&state.client, &state.services.ingestion, "/documents", &headers).await
}

async fn get_document(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(document_id): Path<String>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_get(
        &state.client,
        &state.services.ingestion,
        &format!("/documents/{document_id}"),
        &headers,
    )
    .await
}

async fn list_document_jobs(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(document_id): Path<String>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_get(
        &state.client,
        &state.services.ingestion,
        &format!("/documents/{document_id}/jobs"),
        &headers,
    )
    .await
}

async fn register(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(&state.client, &state.services.auth, "/auth/register", payload, &headers).await
}

async fn login(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(&state.client, &state.services.auth, "/auth/login", payload, &headers).await
}

async fn refresh(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(&state.client, &state.services.auth, "/auth/refresh", payload, &headers).await
}

async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(&state.client, &state.services.auth, "/auth/logout", Value::Null, &headers).await
}

async fn logout_all(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(&state.client, &state.services.auth, "/auth/logout-all", Value::Null, &headers).await
}

async fn me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_get(&state.client, &state.services.auth, "/auth/me", &headers).await
}

async fn verify_email(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(&state.client, &state.services.auth, "/auth/email/verify", payload, &headers).await
}

async fn resend_verification(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(&state.client, &state.services.auth, "/auth/email/resend", payload, &headers).await
}

async fn forgot_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(&state.client, &state.services.auth, "/auth/password/forgot", payload, &headers).await
}

async fn reset_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(&state.client, &state.services.auth, "/auth/password/reset", payload, &headers).await
}

async fn change_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(
        &state.client,
        &state.services.auth,
        "/auth/password/change",
        payload,
        &headers,
    )
    .await
}

async fn list_sessions(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_get(&state.client, &state.services.auth, "/auth/sessions", &headers).await
}

async fn revoke_session(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(session_id): Path<String>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_delete(
        &state.client,
        &state.services.auth,
        &format!("/auth/sessions/{session_id}"),
        &headers,
    )
    .await
}

async fn create_tenant(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(
        &state.client,
        &state.services.auth,
        "/tenants",
        payload,
        &headers,
    )
    .await
}

async fn current_tenant(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_get(&state.client, &state.services.auth, "/tenants/current", &headers).await
}

async fn answer_question(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<impl IntoResponse, StatusCode> {
    proxy_json_with_headers(
        &state.client,
        &state.services.retrieval,
        "/questions",
        payload,
        &headers,
    )
    .await
}

async fn proxy_json_with_headers<T: Serialize>(
    client: &Client,
    base_url: &str,
    path: &str,
    payload: T,
    headers: &HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    let mut request = client.post(format!("{base_url}{path}")).json(&payload);

    request = apply_forwarded_headers(request, headers);

    let response = request.send().await.map_err(|_| StatusCode::BAD_GATEWAY)?;
    let status = response.status();
    let body = response
        .json::<serde_json::Value>()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    Ok((status, Json(body)))
}

async fn proxy_get(
    client: &Client,
    base_url: &str,
    path: &str,
    headers: &HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    let mut request = client.get(format!("{base_url}{path}"));

    request = apply_forwarded_headers(request, headers);

    let response = request.send().await.map_err(|_| StatusCode::BAD_GATEWAY)?;
    let status = response.status();
    let body = response
        .json::<serde_json::Value>()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    Ok((status, Json(body)))
}

async fn proxy_delete(
    client: &Client,
    base_url: &str,
    path: &str,
    headers: &HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    let mut request = client.delete(format!("{base_url}{path}"));

    request = apply_forwarded_headers(request, headers);

    let response = request.send().await.map_err(|_| StatusCode::BAD_GATEWAY)?;
    let status = response.status();
    let body = response
        .json::<serde_json::Value>()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    Ok((status, Json(body)))
}

fn apply_forwarded_headers(mut request: reqwest::RequestBuilder, headers: &HeaderMap) -> reqwest::RequestBuilder {
    for name in [
        header::AUTHORIZATION.as_str(),
        header::USER_AGENT.as_str(),
        "x-forwarded-for",
        "x-real-ip",
    ] {
        if let Some(value) = headers.get(name) {
            request = request.header(name, value.as_bytes());
        }
    }

    request
}

async fn check_service(client: &Client, base_url: &str) -> DependencyHealth {
    let url = format!("{base_url}/health");
    let status = match client.get(&url).send().await {
        Ok(response) if response.status().is_success() => "ok",
        Ok(_) => "degraded",
        Err(_) => "unreachable",
    };

    DependencyHealth {
        status: status.to_string(),
        url,
    }
}

fn env_or(key: &str, fallback: &str) -> String {
    env::var(key).unwrap_or_else(|_| fallback.to_string())
}
