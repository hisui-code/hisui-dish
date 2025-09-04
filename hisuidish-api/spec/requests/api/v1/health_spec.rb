require "rails_helper"

RSpec.describe "Health", type: :request do
  before { host! "localhost" }

  it "returns ok" do
    get "/api/v1/health"
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["status"]).to eq("ok")
  end
end