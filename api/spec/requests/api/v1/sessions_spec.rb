require "rails_helper"

RSpec.describe "Api::V1::Sessions", type: :request do
  describe "POST /api/v1/login" do
    let(:password) { "password" }
    let!(:user) { FactoryBot.create(:user, email: "hisui@mail.com", password: password) }

    context "正しいメールアドレスとパスワード" do
      it "200 OK とauth_tokenを返し、ユーザーにトークンが保存" do
        post "/api/v1/login", params: {
          email: "hisui@mail.com",
          password: password
        }, as: :json

        expect(response).to have_http_status(:ok)

        body = JSON.parse(response.body)
        expect(body["auth_token"]).to be_present
        expect(body["body"]).to include(
          "email" => "hisui@mail.com"
        )

        user.reload
        expect(user.auth_token).to eq(body["auth_token"])
      end
    end

    context "パスワードが間違っている場合" do
      it "401 Unauthorized を返し、auth_token は発行されない" do
        post "/api/v1/login", params: {
                              email: "hisui@mail.com",
                              password: "pasuword"
                            }, as: :json

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to be_present

        user.reload
        expect(user.auth_token).to be_nil
      end
    end

    context "存在しないメールアドレスの場合" do
      it "401 Unauthorized を返す" do
        post "/api/v1/login", params: {
                              email: "unknown@example.com",
                              password: "password123"
                              }, as: :json

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to be_present
      end
    end
  end
end
